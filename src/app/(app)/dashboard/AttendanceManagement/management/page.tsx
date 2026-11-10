"use client";

// src/app/dashboard/AttendanceManagement/management/page.tsx
// Attendance Management dashboard: Daily, Monthly, Calendar, Employee and Reports views.
// Data comes from src/app/data/employeeData.ts (people + live check-ins) and
// src/app/data/attendanceData.ts (history, admin changes, summaries).

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CheckCircle2 } from "lucide-react";
import { DEPARTMENT_ORDER, buildTeam, loadHistory, loadLeaveIds } from "../../../../data/employeeData";
import {
  STATUS_META,
  clearAttendance,
  downloadCsv,
  employeeMonth,
  employmentTypeOf,
  fromKey,
  loadContext,
  monthKeys,
  recordFor,
  setAttendance,
  type AttContext,
  type AttStatus,
} from "../../../../data/attendanceData";
import { AttendanceCtx, EMPTY_FILTERS, VIEWS, type AttApi, type Filters, type Member, type ViewKey } from "./_components/context";
import { useIsMobile } from "./_components/ui";
import DailyView from "./_components/DailyView";
import MonthlyView from "./_components/MonthlyView";
import CalendarView from "./_components/CalendarView";
import EmployeeView from "./_components/EmployeeView";
import ReportsView from "./_components/ReportsView";
import { ImportModal, MarkModal, ProfileModal, SettingsModal } from "./_components/Modals";
import styles from "./attendance.module.css";
import { fetchWithAuth } from "../../../../../../lib/fetchWithAuth";

type ModalState = { kind: "mark"; ids: string[]; date: string } | { kind: "import" } | { kind: "settings" } | { kind: "profile"; id: string } | null;

const VIEW_KEYS = VIEWS.map((v) => v.key);

// true in the browser, false during server rendering (dates and saved data live in the browser).
const noopSubscribe = () => () => { };
const useIsClient = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

// ?view=monthly etc. — read once when the page opens.
function viewFromUrl(): ViewKey {
  const v = new URLSearchParams(window.location.search).get("view") as ViewKey | null;
  return v && VIEW_KEYS.includes(v) ? v : "daily";
}

export default function AttendanceManagementPage() {
  const ready = useIsClient();
  const [version, setVersion] = useState(0);
  const [viewState, setViewState] = useState<ViewKey | null>(null); // null = use the URL
  const [dateState, setDateState] = useState<string | null>(null); // null = today
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Refresh live data every minute and when another tab changes it.
  useEffect(() => {
    const bump = () => setVersion((n) => n + 1);
    const timer = window.setInterval(bump, 60_000);
    window.addEventListener("storage", bump);
    window.addEventListener("focus", bump);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", bump);
      window.removeEventListener("focus", bump);
    };
  }, []);

  const refresh = useCallback(() => setVersion((n) => n + 1), []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ctx: AttContext = useMemo(() => loadContext(), [version, ready]);
  const view: ViewKey = viewState ?? (ready ? viewFromUrl() : "daily");
  const date = dateState ?? ctx.today;

  const employees: Member[] = useMemo(
    () => (ready ? buildTeam(loadHistory(), loadLeaveIds()).map((e) => ({ ...e, employmentType: employmentTypeOf(e) })) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, version],
  );

  // Records for everyone on a day (cheap to compute, so no cache is needed).
  const day = useCallback((d: string) => employees.map((e) => recordFor(e, d, ctx)), [employees, ctx]);

  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const record = useCallback((id: string, d: string) => recordFor(byId.get(id) ?? employees[0], d, ctx), [byId, employees, ctx]);

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department));
    return [...DEPARTMENT_ORDER.filter((d) => set.has(d)), ...[...set].filter((d) => !DEPARTMENT_ORDER.includes(d)).sort()];
  }, [employees]);

  const applyFilters = useCallback(
    (list: Member[], f: Filters = filters, statusDate?: string) => {
      const q = f.q.trim().toLowerCase();
      return list.filter((e) => {
        if (f.dept && e.department !== f.dept) return false;
        if (f.type && e.employmentType !== f.type) return false;
        if (q && ![e.name, e.id, e.department, e.designation, e.email].some((v) => v.toLowerCase().includes(q))) return false;
        if (f.status && statusDate && record(e.id, statusDate).status !== f.status) return false;
        return true;
      });
    },
    [filters, record],
  );

  const setView = useCallback((v: ViewKey) => {
    setViewState(v);
    const url = new URL(window.location.href);
    url.searchParams.set("view", v);
    window.history.replaceState(null, "", url.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const setDate = useCallback((d: string) => setDateState(d > ctx.today ? ctx.today : d), [ctx.today]);

  const year = date ? Number(date.slice(0, 4)) : 2000;
  const month = date ? Number(date.slice(5, 7)) - 1 : 0;

  const setMonth = useCallback(
    (y: number, m: number) => {
      const t = fromKey(ctx.today);
      if (y === t.getFullYear() && m === t.getMonth()) return setDateState(ctx.today);
      const keys = monthKeys(y, m);
      const wanted = Math.min(Number(date.slice(8, 10)) || 1, keys.length);
      const key = keys[wanted - 1];
      setDateState(key > ctx.today ? ctx.today : key);
    },
    [ctx.today, date],
  );

  const notify = useCallback((text: string) => setToast(text), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const quickMark = useCallback(
    (ids: string[], d: string, status: AttStatus) => {
      const chosen = employees.filter((e) => ids.includes(e.id));
      if (!chosen.length) return;
      const withTimes = status === "present" || status === "late" || status === "half-day";
      chosen.forEach((e) => {
        const r = record(e.id, d);
        setAttendance([e], d, {
          status,
          checkIn: withTimes ? (r.checkIn ?? e.shiftStart) : null,
          checkOut: withTimes ? (r.checkOut ?? (d < ctx.today ? "18:30" : null)) : null,
          remarks: status === "leave" ? "Approved Leave" : status === "absent" ? "Marked absent" : r.remarks,
        });
      });
      refresh();
      notify(
        chosen.length === 1 ? `${chosen[0].name} marked ${STATUS_META[status].label}.` : `${chosen.length} employees marked ${STATUS_META[status].label}.`,
      );
    },
    [employees, record, ctx.today, refresh, notify],
  );

  const resetRecord = useCallback(
    (id: string, d: string) => {
      const e = employees.find((x) => x.id === id);
      if (!e) return;
      clearAttendance(e, d);
      refresh();
      notify(`Manual change removed for ${e.name}.`);
    },
    [employees, refresh, notify],
  );

  const exportMonth = useCallback(() => {
    const keys = monthKeys(year, month);
    const header = [
      "Employee ID",
      "Name",
      "Department",
      ...keys.map((k) => String(fromKey(k).getDate())),
      "Present",
      "Late",
      "Half Day",
      "On Leave",
      "Absent",
      "Attendance %",
    ];
    const rows = applyFilters(employees, { ...filters, status: "" }).map((e) => {
      const m = employeeMonth(e, year, month, ctx);
      return [
        e.id,
        e.name,
        e.department,
        ...m.records.map((r) => (r.status ? STATUS_META[r.status].short : "")),
        m.onTime,
        m.late,
        m.halfDay,
        m.leave,
        m.absent,
        m.percent,
      ];
    });
    downloadCsv(`attendance-register-${year}-${String(month + 1).padStart(2, "0")}.csv`, [header, ...rows]);
    notify("Monthly attendance report downloaded.");
  }, [year, month, employees, filters, applyFilters, ctx, notify]);

  const api: AttApi = {
    employees,
    ctx,
    day,
    record,
    date,
    setDate,
    year,
    month,
    setMonth,
    view,
    setView,
    isMobile,
    filters,
    setFilters,
    departments,
    applyFilters,
    selectedEmp,
    setSelectedEmp,
    openMark: (opts) => setModal({ kind: "mark", ids: opts?.ids ?? [], date: opts?.date ?? (date > ctx.today ? ctx.today : date) }),
    quickMark,
    resetRecord,
    openImport: () => setModal({ kind: "import" }),
    openSettings: () => setModal({ kind: "settings" }),
    openProfile: (id) => setModal({ kind: "profile", id }),
    exportMonth,
    notify,
    refresh,
  };

  const closeModal = useCallback(() => setModal(null), []);
  const saved = (message: string) => {
    setModal(null);
    refresh();
    notify(message);
  };

  if (!ready || !date) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading attendance…</div>
      </div>
    );
  }






     

  return (
    <AttendanceCtx.Provider value={api}>
      <div className={styles.page}>
        {view === "daily" && <DailyView />}
        {view === "monthly" && <MonthlyView />}
        {view === "calendar" && <CalendarView />}
        {view === "employee" && <EmployeeView />}
        {view === "reports" && <ReportsView />}

        {modal?.kind === "mark" && (
          <MarkModal key={`${modal.ids.join()}|${modal.date}`} initialIds={modal.ids} initialDate={modal.date} onClose={closeModal} onSaved={saved} />
        )}
        {modal?.kind === "import" && <ImportModal onClose={closeModal} onSaved={saved} />}
        {modal?.kind === "settings" && <SettingsModal onClose={closeModal} onSaved={saved} />}
        {modal?.kind === "profile" && <ProfileModal employeeId={modal.id} onClose={closeModal} />}

        {toast && (
          <div className={styles.toast} role="status">
            <CheckCircle2 size={18} /> {toast}
          </div>
        )}
      </div>


    </AttendanceCtx.Provider>

  );
}
