"use client";

// src/app/dashboard/AnnouncementManagement/page.tsx
// Announcement Management – Employee Wise.
// Create, schedule and track announcements for all employees, departments,
// team leaders, groups or individual people. Data: src/app/data/announcementData.ts

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, ChevronRight, Clock, Megaphone, Plus, Send, XCircle, type LucideIcon } from "lucide-react";
import {
  buildAnnouncement,
  emptyInput,
  fmtDateTime,
  loadAnnouncements,
  loadDrafts,
  loadTemplates,
  newId,
  people,
  saveAnnouncements,
  saveDrafts,
  saveTemplates,
  stats as computeStats,
  statusOf,
  textOf,
  validate,
  type Announcement,
  type AnnouncementInput,
  type Draft,
  type Template,
} from "../../../data/announcementData";
import { todayKey } from "../../../data/employeeData";
import AnnouncementForm, { type FormErrors } from "./_components/AnnouncementForm";
import RecentAnnouncements, { monthRange, type TableFilters } from "./_components/RecentAnnouncements";
import { QuickActions, Tips } from "./_components/Sidebar";
import { ConfirmModal, DraftsModal, TemplatesModal, ViewModal } from "./_components/Modals";
import { cx, useIsClient, useIsMobile } from "./_components/ui";
import styles from "./announcement.module.css";

type ModalState =
  { kind: "view"; id: string } | { kind: "templates" } | { kind: "drafts" } | { kind: "confirm"; action: "cancel" | "delete"; id: string } | null;

const scrollToId = (id: string, focusId?: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (focusId) window.setTimeout(() => document.getElementById(focusId)?.focus(), 350);
};

export default function AnnouncementManagementPage() {
  const ready = useIsClient();
  const isMobile = useIsMobile();
  const [version, setVersion] = useState(0);
  const [tick, setTick] = useState(0);

  const [input, setInput] = useState<AnnouncementInput>(() => emptyInput());
  const [editorKey, setEditorKey] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TableFilters>(() => ({ q: "", status: "", dept: "", type: "", ...monthRange(new Date()) }));
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Statuses change with time (scheduled → active → expired): re-check every minute.
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 60_000);
    const onStorage = () => setVersion((n) => n + 1);
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => new Date(), [tick, version]);
  const today = todayKey(now);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const announcements = useMemo(() => (ready ? loadAnnouncements() : []), [ready, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const drafts = useMemo(() => (ready ? loadDrafts() : []), [ready, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const templates = useMemo(() => (ready ? loadTemplates() : []), [ready, version]);
  const list = useMemo(() => (ready ? people() : []), [ready]);
  const s = useMemo(() => computeStats(announcements, now), [announcements, now]);

  const errors: FormErrors = useMemo(() => (submitted && ready ? validate(input, now) : {}), [submitted, ready, input, now]);

  const refresh = useCallback(() => setVersion((n) => n + 1), []);
  const notify = useCallback((t: string) => setToast(t), []);

  const resetForm = () => {
    setInput(emptyInput(today));
    setEditorKey((k) => k + 1);
    setSubmitted(false);
    setDraftId(null);
  };

  const loadIntoForm = (next: AnnouncementInput) => {
    setInput(next);
    setEditorKey((k) => k + 1);
    setSubmitted(false);
    scrollToId("create-announcement", "announcement-title");
  };

  /* ---------------- Form actions ---------------- */

  const send = () => {
    setSubmitted(true);
    const e = validate(input, now);
    if (Object.keys(e).length) {
      notify("Please fix the highlighted fields.");
      scrollToId("create-announcement");
      return;
    }
    const a = buildAnnouncement(input, new Date());
    saveAnnouncements([a, ...announcements]);
    if (draftId) saveDrafts(drafts.filter((d) => d.id !== draftId));
    resetForm();
    refresh();
    notify(
      input.schedule === "later"
        ? `Scheduled for ${fmtDateTime(a.sendAt)} · ${a.recipientIds.length} recipients.`
        : `Announcement sent to ${a.recipientIds.length} ${a.recipientIds.length === 1 ? "employee" : "employees"}.`,
    );
  };

  const saveDraft = () => {
    if (!input.title.trim() && !textOf(input.message)) {
      notify("Add a title or message before saving a draft.");
      return;
    }
    const id = draftId ?? newId("draft");
    const d: Draft = { id, savedAt: new Date().toISOString(), input };
    saveDrafts([d, ...drafts.filter((x) => x.id !== id)]);
    setDraftId(id);
    refresh();
    notify("Draft saved. Find it under Quick Actions → View Drafts.");
  };

  /* ---------------- Table actions ---------------- */

  const duplicate = (a: Announcement) => {
    setDraftId(null);
    loadIntoForm({
      ...emptyInput(today),
      title: `Copy of ${a.title}`,
      message: a.message,
      attachments: a.attachments,
      audience: a.audience,
      category: a.category ?? "",
      logo: a.logo ?? null,
      cover: a.cover ?? null,
      pinned: !!a.pinned,
      urgent: !!a.urgent,
    });
    setModal(null);
    notify("Copied into the form. Set new dates and send.");
  };

  const confirmAction = (action: "cancel" | "delete", id: string) => {
    if (action === "cancel") {
      saveAnnouncements(announcements.map((a) => (a.id === id ? { ...a, cancelledAt: new Date().toISOString() } : a)));
      notify("Announcement cancelled.");
    } else {
      saveAnnouncements(announcements.filter((a) => a.id !== id));
      notify("Announcement deleted.");
    }
    setModal(null);
    refresh();
  };

  /* ---------------- Templates & drafts ---------------- */

  const applyTemplate = (t: Template) => {
    loadIntoForm({ ...input, title: t.title, message: t.message });
    setModal(null);
    notify(`Template “${t.name}” loaded.`);
  };

  const saveTemplate = (name: string) => {
    saveTemplates([{ id: newId("tpl"), name, title: input.title.trim(), message: input.message }, ...templates]);
    refresh();
    notify(`Template “${name}” saved.`);
  };

  /* ---------------- Render ---------------- */

  const viewing = modal?.kind === "view" ? announcements.find((a) => a.id === modal.id) : undefined;
  const confirming = modal?.kind === "confirm" ? announcements.find((a) => a.id === modal.id) : undefined;

  const statCards: {
    icon: LucideIcon;
    label: string;
    short: string;
    value: number;
    change: number;
    goodUp: boolean;
    color: string;
    soft: string;
    tint: string;
  }[] = [
    {
      icon: Megaphone,
      label: "Total Announcements",
      short: "Total",
      value: s.total,
      change: s.totalChange,
      goodUp: true,
      color: "#15803d",
      soft: "#d4f0de",
      tint: "#f1faf4",
    },
    {
      icon: Send,
      label: "Sent Successfully",
      short: "Sent",
      value: s.sent,
      change: s.sentChange,
      goodUp: true,
      color: "#2f7de1",
      soft: "#dce9fb",
      tint: "#f2f7fe",
    },
    {
      icon: Clock,
      label: "Scheduled",
      short: "Scheduled",
      value: s.scheduled,
      change: s.scheduledChange,
      goodUp: true,
      color: "#e08a0b",
      soft: "#fde9c9",
      tint: "#fffaf1",
    },
    {
      icon: XCircle,
      label: "Cancelled",
      short: "Cancelled",
      value: s.cancelled,
      change: s.cancelledChange,
      goodUp: false,
      color: "#e5484d",
      soft: "#fbdcdc",
      tint: "#fef5f5",
    },
  ];

  if (!ready) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Loading announcements…</p>
      </div>
    );
  }

  const quick = (
    <QuickActions
      drafts={drafts.length}
      scheduled={s.scheduled}
      onCreate={() => scrollToId("create-announcement", "announcement-title")}
      onTemplates={() => setModal({ kind: "templates" })}
      onDrafts={() => setModal({ kind: "drafts" })}
      onScheduled={() => {
        setFilters({ q: "", status: "scheduled", dept: "", type: "", from: "", to: "" });
        scrollToId("recent-title");
      }}
    />
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          {!isMobile && (
            <nav className={styles.crumb} aria-label="Breadcrumb">
              <Link href="/dashboard">Home</Link>
              <ChevronRight size={13} />
              <span>Announcement Management</span>
              <ChevronRight size={13} />
              <b>Employee Wise</b>
            </nav>
          )}
          <h1>{isMobile ? "Create Announcement" : "Announcement Management - Employee Wise"}</h1>
          <p>
            {isMobile
              ? "Share important updates, policies, events or information with your employees."
              : "Create, manage and track announcements for employees, departments or specific groups"}
          </p>
        </div>
        {!isMobile && (
          <button className={styles.primaryBtn} onClick={() => scrollToId("create-announcement", "announcement-title")}>
            <Plus size={18} /> Create Announcement
          </button>
        )}
      </header>

      <div className={styles.topGrid}>
        <div className={styles.main}>
          {/* Stats */}
          <section className={styles.stats}>
            {statCards.map((c) => {
              const up = c.change > 0;
              const good = c.change === 0 ? null : up === c.goodUp;
              return (
                <div key={c.label} className={styles.stat} style={{ background: c.tint }}>
                  <span className={styles.statIcon} style={{ color: c.color, background: c.soft }}>
                    <c.icon />
                  </span>
                  <div className={styles.statBody}>
                    <strong>{c.value}</strong>
                    <span className={styles.statLabel}>{isMobile ? c.short : c.label}</span>
                    <span className={styles.statTrend}>
                      <em className={cx(good === true && styles.trendGood, good === false && styles.trendBad)}>
                        {c.change > 0 ? <ArrowUp size={11} strokeWidth={3} /> : c.change < 0 ? <ArrowDown size={11} strokeWidth={3} /> : null}
                        {c.change > 0 ? "+" : ""}
                        {c.change}%
                      </em>
                      {!isMobile && <small>vs last month</small>}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          <AnnouncementForm
            input={input}
            onChange={(next) => setInput(next)}
            errors={errors}
            editorKey={String(editorKey)}
            list={list}
            isMobile={isMobile}
            today={today}
            onSend={send}
            onCancel={resetForm}
            onSaveDraft={saveDraft}
            onAddAttachments={(files) => setInput((prev) => ({ ...prev, attachments: [...prev.attachments, ...files] }))}
            onLogo={(logo, cover) => setInput((prev) => ({ ...prev, logo, cover }))}
          />
        </div>

        {!isMobile && (
          <aside className={styles.aside}>
            {quick}
            <Tips />
          </aside>
        )}
      </div>

      <RecentAnnouncements
        items={announcements}
        list={list}
        now={now}
        filters={filters}
        setFilters={setFilters}
        isMobile={isMobile}
        onView={(a) => setModal({ kind: "view", id: a.id })}
        onDuplicate={duplicate}
        onCancel={(a) => setModal({ kind: "confirm", action: "cancel", id: a.id })}
        onDelete={(a) => setModal({ kind: "confirm", action: "delete", id: a.id })}
        onRefresh={() => {
          refresh();
          notify("Announcements refreshed.");
        }}
      />

      {isMobile && (
        <div className={styles.mobileSide}>
          {quick}
          <Tips />
        </div>
      )}

      {/* Dialogs */}
      {viewing && (
        <ViewModal
          a={viewing}
          list={list}
          now={now}
          onClose={() => setModal(null)}
          onDuplicate={() => duplicate(viewing)}
          onCancel={() => setModal({ kind: "confirm", action: "cancel", id: viewing.id })}
        />
      )}
      {modal?.kind === "templates" && (
        <TemplatesModal
          templates={templates}
          canSaveCurrent={!!input.title.trim() && !!textOf(input.message)}
          onUse={applyTemplate}
          onSaveCurrent={saveTemplate}
          onDelete={(id) => {
            saveTemplates(templates.filter((t) => t.id !== id));
            refresh();
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "drafts" && (
        <DraftsModal
          drafts={drafts}
          onLoad={(d) => {
            setDraftId(d.id);
            loadIntoForm({ ...emptyInput(today), ...d.input });
            setModal(null);
            notify("Draft loaded into the form.");
          }}
          onDelete={(id) => {
            saveDrafts(drafts.filter((d) => d.id !== id));
            if (draftId === id) setDraftId(null);
            refresh();
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "confirm" && confirming && (
        <ConfirmModal
          title={
            modal.action === "cancel"
              ? statusOf(confirming, now) === "scheduled"
                ? "Cancel this scheduled announcement?"
                : "Cancel this announcement?"
              : "Delete this announcement?"
          }
          message={
            modal.action === "cancel"
              ? `“${confirming.title}” will stop showing to employees. It stays in the list as Cancelled.`
              : `“${confirming.title}” will be removed permanently.`
          }
          confirmLabel={modal.action === "cancel" ? "Cancel announcement" : "Delete"}
          onConfirm={() => confirmAction(modal.action, confirming.id)}
          onClose={() => setModal(null)}
        />
      )}

      {toast && (
        <div className={styles.toast} role="status">
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}
    </div>
  );
}
