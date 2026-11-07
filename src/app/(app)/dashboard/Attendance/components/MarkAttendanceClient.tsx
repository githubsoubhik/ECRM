'use client';

// src/app/dashboard/Attendance/components/MarkAttendanceClient.tsx
// Kiosk mode: one camera, many employees. After Submit the record goes into
// today's attendance history and the camera reopens for the next person.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Coffee,
  Info,
  LogIn,
  LogOut,
  ShieldCheck,
  Timer,
  Trash2,
  Users,
} from 'lucide-react';
import styles from '../mark/mark.module.css';

import BreakTimerBar from './BreakTimerBar';
import CameraCapture, { CaptureResult } from './CameraCapture';
import VerificationSteps, { Stage } from './VerificationSteps';
import EmployeeDetailsCard from './EmployeeDetailsCard';
import EditProfileModal from './EditProfileModal';

import {
  ACTION_META,
  AttendanceAction,
  AttendanceEvent,
  CURRENT_EMPLOYEE_ID,
  EMPLOYEE_DB,
  Employee,
  VerificationResult,
  attendanceStatus,
  breakMinutes,
  buildLog,
  canPerform,
  durationLabel,
  formatClock,
  formatDateChip,
  formatTime,
  loadHistory,
  loadProfile,
  elapsedLabel,
  needsPhoto,
  newEvent,
  nextEmployeeToMark,
  onBreak,
  saveHistory,
  saveProfile,
  sortHistory,
  verifyFaceDemo,
  workedMinutes,
} from '@/app/data/employeeData';

// Sends the camera photo to /api/save-photo, which saves it in pavion_crm/attendance-photos/
async function savePhotoToProject(dataUrl: string, employeeId: string, action: AttendanceAction): Promise<string | null> {
  try {
    const res = await fetch('/api/save-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: dataUrl, name: `${employeeId}_${action}` }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.fileName as string;
  } catch {
    return null;
  }
}

const ACTIONS: AttendanceAction[] = ['check-in', 'check-out', 'break-start', 'break-end'];

const ACTION_ICON: Record<AttendanceAction, React.ReactNode> = {
  'check-in': <LogIn size={16} />,
  'check-out': <LogOut size={16} />,
  'break-start': <Coffee size={16} />,
  'break-end': <Coffee size={16} />,
};

const GUIDELINES = [
  'Make sure your face is clearly visible',
  'Be in a well-lit environment',
  'Do not use someone else’s photo',
  'Camera access is required to mark attendance',
  'Attendance can only be marked from office location',
];

const isAction = (v: string | null): v is AttendanceAction =>
  v === 'check-in' || v === 'check-out' || v === 'break-start' || v === 'break-end';

export default function MarkAttendanceClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [autoScan, setAutoScan] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  // Who is marking right now, and everything recorded today.
  const [selectedId, setSelectedId] = useState<string>(CURRENT_EMPLOYEE_ID);
  const [employee, setEmployee] = useState<Employee>(() => loadProfile(CURRENT_EMPLOYEE_ID));
  const [history, setHistory] = useState<AttendanceEvent[]>([]);

  const [action, setAction] = useState<AttendanceAction>('check-in');
  const [stage, setStage] = useState<Stage>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [pendingCapture, setPendingCapture] = useState<CaptureResult | null>(null);
  const [actionLocked, setActionLocked] = useState(false);
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* ---------------- Load + clock (client only) ---------------- */

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);

    const timer = window.setTimeout(() => {
      setNow(new Date());
      setHistory(sortHistory(loadHistory()));
    }, 0);

    return () => {
      clearInterval(t);
      clearTimeout(timer);
    };
  }, []);

  // Profile of whoever is selected.
  useEffect(() => {
    const timer = window.setTimeout(() => setEmployee(loadProfile(selectedId)), 0);
    return () => window.clearTimeout(timer);
  }, [selectedId]);

  // ?action=check-in from the dashboard button.
  useEffect(() => {
    const requested = params.get('action');
    if (!isAction(requested)) return;

    const timer = window.setTimeout(() => {
      if (requested === 'check-out') {
        setConfirmCheckout(true);
        return;
      }
      setAction(requested);
      setActionLocked(true);
      setAutoStart(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [params]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // The success banner clears itself.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  /* ---------------- Derived ---------------- */

  // Each employee's day is rebuilt from the history, so deleting a row frees them up.
  const log = useMemo(() => buildLog(selectedId, history), [selectedId, history]);

  const permission = canPerform(action, log);
  const status = attendanceStatus(log, employee);
  const working = onBreak(log) ? 'On Break' : log.checkOut ? 'Checked Out' : log.checkIn ? 'Checked In' : 'Not Marked';
  // "busy" = a photo is waiting for Submit, or verification is running
  const busy = ['review', 'verifying', 'matching'].includes(stage);
  const flowActive = actionLocked || busy;
  const meta = ACTION_META[action];
  const photoRequired = needsPhoto(action);              // breaks never use the camera
  const openBreak = log.breaks.find((b) => !b.end) ?? null;

  const summary = useMemo(() => {
    const ref = now ?? new Date();
    return {
      checkIn: formatTime(log.checkIn),
      checkOut: formatTime(log.checkOut),
      breaks: durationLabel(breakMinutes(log, ref)),
      worked: durationLabel(workedMinutes(log, ref)),
    };
  }, [log, now]);

  /* ---------------- Flow control ---------------- */

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Forces the camera to open again (the flag has to flip to re-trigger).
  const reopenCamera = useCallback(() => {
    setAutoStart(false);
    timers.current.push(setTimeout(() => setAutoStart(true), 0));
  }, []);

  // Ends the current action and unlocks every button.
  const cancelAction = useCallback(() => {
    clearTimers();
    setStage('idle');
    setResult(null);
    setPhoto(null);
    setPendingCapture(null);
    setAutoStart(false);
    setActionLocked(false);
  }, []);

  // Hands the camera to the next person.
  const readyForNext = useCallback((updatedHistory: AttendanceEvent[], justMarkedId: string) => {
    clearTimers();
    setStage('idle');
    setResult(null);
    setPhoto(null);
    setPendingCapture(null);
    setActionLocked(false);
    setAction('check-in');
    setSelectedId(nextEmployeeToMark(updatedHistory, justMarkedId));
    reopenCamera(); // the camera opens again for the next employee
  }, [reopenCamera]);

  const commitEvent = useCallback(
    (event: AttendanceEvent) => {
      const updated = sortHistory([...history, event]);
      saveHistory(updated);
      setHistory(updated);
      return updated;
    },
    [history]
  );

  const handleSelectEmployee = (id: string) => {
    if (busy) return; // can't switch while a photo is waiting or verifying
    clearTimers();
    setSelectedId(id);
    setAction('check-in');
    setActionLocked(false);
    setResult(null);
    setPhoto(null);
    setPendingCapture(null);
    if (stage !== 'live' && stage !== 'starting') {
      setStage('idle');
      reopenCamera();
    }
  };

  const handleActionChange = (next: AttendanceAction) => {
    if (flowActive && next !== action) return;

    if (next === 'check-out' && canPerform('check-out', log).allowed) {
      setConfirmCheckout(true);
      return;
    }

    // Break Start / Break End: no camera, just the timer panel
    if (!needsPhoto(next)) {
      clearTimers();
      setAction(next);
      setActionLocked(false);
      setStage('idle');
      setResult(null);
      setPhoto(null);
      setPendingCapture(null);
      setAutoStart(false);
      return;
    }

    if (next === action) {
      if (!canPerform(next, log).allowed) return;
      setActionLocked(true);
      if (stage !== 'live' && stage !== 'starting') {
        setStage('idle');
        reopenCamera();
      }
      return;
    }

    setAction(next);
    setActionLocked(canPerform(next, log).allowed);
    setPhoto(null);
    setPendingCapture(null);
    setResult(null);
    setStage('idle');
    if (canPerform(next, log).allowed) reopenCamera();
    else setAutoStart(false);
  };

  // OK in the check-out popup: marked straight away, no photo.
  const confirmCheckoutNow = () => {
    const at = new Date();
    const updated = commitEvent(newEvent(employee, 'check-out', at, null, null));
    setConfirmCheckout(false);
    setNotice(`${employee.name} checked out at ${formatTime(at.toISOString())}`);
    readyForNext(updated, employee.id);
  };

  // Break Start / Break End are recorded straight away, without a photo.
  const markBreak = (breakAction: AttendanceAction) => {
    if (!canPerform(breakAction, log).allowed) return;
    const at = new Date();
    commitEvent(newEvent(employee, breakAction, at, null, null));
    setNotice(`${employee.name} (${employee.id}) ${ACTION_META[breakAction].verb} at ${formatTime(at.toISOString())}`);
    setAction(breakAction === 'break-start' ? 'break-end' : 'break-start');
    setStage('idle');
    setAutoStart(false);
    setActionLocked(false);
  };

  // Photo captured: it stays on screen until Submit.
  const handleCapture = useCallback((capture: CaptureResult) => {
    setPhoto(capture.dataUrl);
    setPendingCapture(capture);
    setStage('review');
    setAutoStart(false);
    setActionLocked(true);
  }, []);

  // "Take another picture": drop the photo, the camera reopens itself.
  const handleRetake = useCallback(() => {
    setPhoto(null);
    setPendingCapture(null);
    setResult(null);
  }, []);

  // Submit: save the photo, verify, write the history row, hand over to the next person.
  const handleSubmit = useCallback(() => {
    const capture = pendingCapture;
    if (!capture) return;

    const upload = savePhotoToProject(capture.dataUrl, employee.id, action);
    setStage('verifying');

    const wait = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

    wait(700, () => setStage('matching'));
    wait(1800, async () => {
      const verification = verifyFaceDemo(capture.metrics, employee.id);
      setResult(verification);

      if (!verification.ok) {
        setStage('failed');
        return;
      }

      const fileName = await upload;
      const at = new Date();
      const updated = commitEvent(newEvent(employee, action, at, fileName, verification.confidence));

      setNotice(
        `${employee.name} ${ACTION_META[action].verb} at ${formatTime(at.toISOString())}${
          fileName ? ` · photo ${fileName}` : ' · photo not saved'
        }`
      );
      readyForNext(updated, employee.id);
    });
  }, [pendingCapture, action, employee, commitEvent, readyForNext]);

  /* ---------------- History ---------------- */

  const handleDelete = (id: string) => {
    const row = history.find((e) => e.id === id);
    const updated = history.filter((e) => e.id !== id);
    saveHistory(updated);
    setHistory(updated);
    if (row) setNotice(`Deleted: ${row.employeeName} · ${ACTION_META[row.action].label}. They can mark it again now.`);
  };

  const handleClearAll = () => {
    saveHistory([]);
    setHistory([]);
    setNotice('Today’s attendance history cleared.');
  };

  const handleProfileSave = (updated: Employee) => {
    setEmployee(updated);
    saveProfile(updated);
    setEditOpen(false);
  };

  return (
    <div className={styles.page}>
      {/* Breadcrumb + title */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <button type="button" className={styles.crumbLink} onClick={() => router.push('/dashboard')}>
          Dashboard
        </button>
        <ChevronRight size={13} aria-hidden />
        <button type="button" className={styles.crumbLink} onClick={() => router.push('/dashboard/Attendance')}>
          Attendance
        </button>
        <ChevronRight size={13} aria-hidden />
        <span className={styles.crumbCurrent}>Mark Attendance</span>
      </nav>

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button type="button" className={styles.backBtn} onClick={() => router.push('/dashboard/Attendance')}>
            <ArrowLeft size={18} />
            <span className={styles.srOnly}>Back to attendance</span>
          </button>
          <div>
            <h1 className={styles.title}>Mark Your Attendance</h1>
            <p className={styles.subtitle}>
              Capture your photo to check in or check out. Your attendance will be recorded with the timestamp and location.
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.dateChip}>
            <Calendar size={16} aria-hidden />
            {now ? formatDateChip(now) : ''}
          </span>
          <span className={`${styles.statusChip} ${styles[`status${status.replace(' ', '')}`] ?? ''}`}>
            <span className={styles.statusDot} />
            {status}
          </span>
        </div>
      </header>

      {/* Mobile-only identity strip */}
      <div className={styles.mobileIdentity}>
        <EmployeeDetailsCard
          employee={employee}
          variant="compact"
          status={status}
          dateLabel={now ? formatDateChip(now) : ''}
          onEdit={() => setEditOpen(true)}
        />
      </div>

      {/* Running break timers — only visible while somebody is on a break */}
      <BreakTimerBar history={history} />

      {notice && (
        <p className={styles.notice} role="status">
          <Check size={16} aria-hidden />
          {notice}
        </p>
      )}

      {/* 3-Column Layout: Steps -> Action & Camera -> Employee Details */}
      <div className={styles.layout}>
        {/* Left Column: Verification Steps & Guidelines */}
        <section className={styles.stepsColumn}>
          {/* The steps only apply to photo actions */}
          {photoRequired && <VerificationSteps stage={stage} action={action} />}

          <div className={styles.guidelines}>
            <p className={styles.guidelinesTitle}>
              <ShieldCheck size={16} aria-hidden />
              Important Guidelines
            </p>
            <ul className={styles.guidelinesList}>
              {GUIDELINES.map((g) => (
                <li key={g}>
                  <Check size={14} aria-hidden />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Center Column: Employee picker + actions + camera */}
        <section className={styles.mainCard}>
          <div className={styles.kioskRow}>
            <label className={styles.kioskLabel} htmlFor="kiosk-employee">
              <Users size={15} aria-hidden />
              Marking for
            </label>
            <select
              id="kiosk-employee"
              className={styles.kioskSelect}
              value={selectedId}
              disabled={busy}
              onChange={(e) => handleSelectEmployee(e.target.value)}
            >
              {EMPLOYEE_DB.map((e) => {
                const empLog = buildLog(e.id, history);
                const state = empLog.checkOut
                  ? 'checked out'
                  : onBreak(empLog)
                  ? 'on break'
                  : empLog.checkIn
                  ? 'checked in'
                  : 'not marked';
                return (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.id}) — {state}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Action buttons */}
          <div className={styles.actionRow} role="tablist" aria-label="Attendance action">
            {ACTIONS.map((a) => {
              const allowed = canPerform(a, log).allowed;
              const lockedOut = flowActive && a !== action;
              const m = ACTION_META[a];
              return (
                <button
                  key={a}
                  type="button"
                  role="tab"
                  aria-selected={a === action}
                  className={`${styles.actionBtn} ${a === action ? styles.actionBtnActive : ''} ${
                    !allowed ? styles.actionBtnBlocked : ''
                  }`}
                  style={{ ['--action' as string]: m.color, ['--action-soft' as string]: m.soft }}
                  onClick={() => handleActionChange(a)}
                  disabled={lockedOut}
                  title={lockedOut ? 'Finish or cancel the current action first' : canPerform(a, log).reason}
                >
                  {ACTION_ICON[a]}
                  {m.label}
                </button>
              );
            })}
          </div>

          {flowActive && stage !== 'verifying' && stage !== 'matching' && (
            <button type="button" className={styles.changeActionBtn} onClick={cancelAction}>
              Cancel {meta.label} and choose another action or employee
            </button>
          )}

          <div className={styles.cameraColumn}>
            <h2 className={styles.mobileSectionTitle}>Capture Your Photo</h2>
            <p className={styles.mobileSectionSub}>
              Allow camera access and take a clear photo of your face to mark your attendance.
            </p>

            {photoRequired ? (
              <CameraCapture
                stage={stage}
                action={action}
                photo={photo}
                autoStart={autoStart}
                autoScan={autoScan}
                disabled={!permission.allowed}
                disabledReason={permission.reason}
                onToggleAutoScan={() => setAutoScan((prev) => !prev)}
                onStageChange={setStage}
                onCapture={handleCapture}
                onSubmit={handleSubmit}
                onRetake={handleRetake}
              />
            ) : (
              /* Break panel replaces the camera */
              <div className={styles.breakPanel}>
                <span className={styles.breakIcon}>
                  <Timer size={24} />
                </span>
                <p className={styles.breakWho}>
                  {employee.name} <span className={styles.breakId}>{employee.id}</span>
                </p>

                {openBreak ? (
                  <>
                    <p className={styles.breakClock}>{elapsedLabel(openBreak.start, now ?? new Date())}</p>
                    <p className={styles.breakSub}>
                      On break since {formatTime(openBreak.start)}. No photo is needed for breaks.
                    </p>
                  </>
                ) : (
                  <>
                    <p className={styles.breakClock}>00:00:00</p>
                    <p className={styles.breakSub}>
                      {canPerform('break-start', log).allowed
                        ? 'The timer starts as soon as you tap the button below.'
                        : canPerform('break-start', log).reason}
                    </p>
                  </>
                )}

                <button
                  type="button"
                  className={styles.breakBtn}
                  disabled={!canPerform(openBreak ? 'break-end' : 'break-start', log).allowed}
                  style={{
                    ['--action' as string]: openBreak ? ACTION_META['break-end'].color : ACTION_META['break-start'].color,
                  }}
                  onClick={() => markBreak(openBreak ? 'break-end' : 'break-start')}
                >
                  {openBreak ? 'End break' : 'Start break'}
                </button>
              </div>
            )}

            {stage === 'failed' && (
              <div className={styles.resultFail} role="alert">
                <p className={styles.resultTitle}>Verification failed</p>
                <p className={styles.resultSub}>{result?.message ?? 'We could not verify this photo.'}</p>
                <button type="button" className={styles.primaryBtn} onClick={cancelAction}>
                  Start over
                </button>
              </div>
            )}
          </div>

          {/* Selected employee's day */}
          <div className={styles.todayStrip}>
            <span className={styles.todayItem}>
              <span className={styles.todayLabel}>Status</span>
              <strong>{working}</strong>
            </span>
            <span className={styles.todayItem}>
              <span className={styles.todayLabel}>Check In</span>
              <strong>{summary.checkIn}</strong>
            </span>
            <span className={styles.todayItem}>
              <span className={styles.todayLabel}>Check Out</span>
              <strong>{summary.checkOut}</strong>
            </span>
            <span className={styles.todayItem}>
              <span className={styles.todayLabel}>Break</span>
              <strong>{summary.breaks}</strong>
            </span>
            <span className={styles.todayItem}>
              <span className={styles.todayLabel}>Worked</span>
              <strong>{summary.worked}</strong>
            </span>
          </div>

          {/* Today's attendance history */}
          <div className={styles.historyCard}>
            <div className={styles.historyHead}>
              <h2 className={styles.historyTitle}>Attendance History ({history.length})</h2>
              {history.length > 0 && (
                <button type="button" className={styles.clearBtn} onClick={handleClearAll}>
                  Clear all
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className={styles.historyEmpty}>Nothing marked yet today.</p>
            ) : (
              <div className={styles.historyTableWrap}>
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th scope="col">Time</th>
                      <th scope="col">Employee</th>
                      <th scope="col">Action</th>
                      <th scope="col">Photo</th>
                      <th scope="col">Match</th>
                      <th scope="col">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((e) => {
                      const m = ACTION_META[e.action];
                      return (
                        <tr key={e.id}>
                          <td>{formatTime(e.at)}</td>
                          <td>
                            {e.employeeName}
                            <span className={styles.historyId}>{e.employeeId}</span>
                          </td>
                          <td>
                            <span
                              className={styles.historyPill}
                              style={{ ['--action' as string]: m.color, ['--action-soft' as string]: m.soft }}
                            >
                              {m.label}
                            </span>
                          </td>
                          <td className={styles.historyFile}>{e.photoFile ?? '—'}</td>
                          <td>{e.confidence ? `${e.confidence}%` : '—'}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.deleteBtn}
                              onClick={() => handleDelete(e.id)}
                              title={`Delete this record so ${e.employeeName} can mark it again`}
                            >
                              <Trash2 size={15} />
                              <span className={styles.srOnly}>Delete record</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Employee Details Sidebar */}
        <aside className={styles.sideColumn}>
          <EmployeeDetailsCard
            employee={employee}
            variant="full"
            status={status}
            dateLabel={now ? formatDateChip(now) : ''}
            timeLabel={now ? formatClock(now) : ''}
            onEdit={() => setEditOpen(true)}
          />
        </aside>
      </div>

      <p className={styles.mobileNote}>
        <Info size={16} aria-hidden />
        <span>
          Your photo will be securely stored and used only for attendance verification.
          <span className={styles.mobileNoteSub}>By continuing, you agree to our company attendance policy.</span>
        </span>
      </p>

      {/* Check-out confirmation popup */}
      {confirmCheckout && (
        <div
          className={styles.confirmOverlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmCheckout(false);
          }}
        >
          <div className={styles.confirmBox} role="alertdialog" aria-modal="true" aria-labelledby="checkout-title">
            <span className={styles.confirmIcon}>
              <LogOut size={22} />
            </span>
            <h2 id="checkout-title" className={styles.confirmTitle}>Check out now?</h2>
            <p className={styles.confirmText}>
              This closes {employee.name}&apos;s work day at {now ? formatClock(now) : 'the current time'}.
            </p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.ghostBtn} onClick={() => setConfirmCheckout(false)}>
                Cancel
              </button>
              <button type="button" className={styles.confirmOkBtn} onClick={confirmCheckoutNow} autoFocus>
                OK, check out
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <EditProfileModal employee={employee} onClose={() => setEditOpen(false)} onSave={handleProfileSave} />
      )}
    </div>
  );
}