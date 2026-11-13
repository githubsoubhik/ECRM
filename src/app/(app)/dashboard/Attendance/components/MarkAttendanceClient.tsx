

'use client';

// src/app/(app)/dashboard/Attendance/components/MarkAttendanceClient.tsx
// Self-service mode: the logged-in employee marks their own attendance.
// The server (JWT cookie) decides who the user is; the browser never picks an employee.
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
} from 'lucide-react';
import styles from '../mark/mark.module.css';

import BreakTimerBar from './BreakTimerBar';
import CameraCapture, { CaptureResult } from './CameraCapture';
import VerificationSteps, { Stage } from './VerificationSteps';
import EmployeeDetailsCard from './EmployeeDetailsCard';
import EditProfileModal from './EditProfileModal';

import {
 
  apiCheckIn,
  apiCheckOut,
  apiBreakStart,
  apiBreakEnd,
  getCoords,
} from '@/app/data/attendanceApi';

import {
  ACTION_META,
  AttendanceAction,
  AttendanceEvent,
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
  elapsedLabel,
  needsPhoto,
  newEvent,
  onBreak,
  saveHistory,
  saveProfile,
  sortHistory,
  verifyFaceDemo,
  workedMinutes,
} from '@/app/data/employeeData';
import { useAuth } from '@/app/(app)/context/AuthContext';

const DEV = process.env.NODE_ENV !== 'production';
// Only set NEXT_PUBLIC_ALLOW_NO_PHOTO=true on a dev machine.
const ALLOW_NO_PHOTO = process.env.NEXT_PUBLIC_ALLOW_NO_PHOTO === 'true';

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

/* ------------------------------------------------------------------ */
/* Wrapper: wait for the logged-in user before rendering anything      */
/* ------------------------------------------------------------------ */

export default function MarkAttendanceClient() {
  const { user, loading } = useAuth();
  if (loading || !user) return <div className={styles.page}>Loading…</div>;
  return <MarkAttendance currentUser={user} />;
}



function MarkAttendance({ currentUser }: { currentUser: Employee }) {
  const router = useRouter();
  const params = useSearchParams();

  const [autoScan, setAutoScan] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  // The logged-in user is the only person who can mark here.
  const selectedId = currentUser.id;
  const [employee, setEmployee] = useState<Employee>(currentUser);
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

  /* ---------------- Clock ---------------- */

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ---------------- Today's record from the server ---------------- */

  // useEffect(() => {
  //   let alive = true;
  //   (async () => {
  //     try {
  //       const rec = (await apiToday()).data;
  //       const events: AttendanceEvent[] = [];

  //       if (rec?.checkIn) {
  //         events.push(newEvent(currentUser, 'check-in', new Date(rec.checkIn), rec.checkInPhoto ?? null, null));
  //         for (const b of rec.breaks ?? []) {
  //           events.push(newEvent(currentUser, 'break-start', new Date(b.start), null, null));
  //           if (b.end) events.push(newEvent(currentUser, 'break-end', new Date(b.end), null, null));
  //         }
  //         if (rec.checkOut) {
  //           events.push(newEvent(currentUser, 'check-out', new Date(rec.checkOut), null, null));
  //         }
  //       }
  //       if (!alive) return;

  //       const sorted = sortHistory(events);
  //       saveHistory(sorted);
  //       setHistory(sorted);

  //       const inBreak = (rec?.breaks ?? []).some((b: { end?: string | null }) => !b.end);
  //       setAction(!rec?.checkIn ? 'check-in' : rec.checkOut ? 'check-in' : inBreak ? 'break-end' : 'break-start');
  //     } catch {
  //       // Offline or server error: show only this user's local rows.
  //       if (alive) {
  //         setHistory(sortHistory(loadHistory().filter((e) => e.employeeId === currentUser.id)));
  //       }
  //     }
  //   })();
  //   return () => {
  //     alive = false;
  //   };
  // }, [currentUser]);

  // Keep the card in sync if the user object changes (e.g. after refresh()).
  useEffect(() => {
    setEmployee(currentUser);
  }, [currentUser]);

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
      if (needsPhoto(requested)) {
        setActionLocked(true);
        setAutoStart(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [params]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // The notice clears itself.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  /* ---------------- Derived ---------------- */

  const log = useMemo(() => buildLog(selectedId, history), [selectedId, history]);

  const permission = canPerform(action, log);
  const status = attendanceStatus(log, employee);
  const working = onBreak(log) ? 'On Break' : log.checkOut ? 'Checked Out' : log.checkIn ? 'Checked In' : 'Not Marked';
  const busy = ['review', 'verifying', 'matching'].includes(stage);
  const flowActive = actionLocked || busy;
  const meta = ACTION_META[action];
  const photoRequired = needsPhoto(action);
  const openBreak = log.breaks.find((b) => !b.end) ?? null;
  const dayDone = !!log.checkOut;



  const summary = useMemo(() => {
    const ref = now ?? new Date();
    return {
      checkIn: formatTime(log.checkIn),
      checkOut: formatTime(log.checkOut),
      breaks: durationLabel(breakMinutes(log, ref)),
      worked: durationLabel(workedMinutes(log, ref)),
    };
  }, [log, now]);

  // Which buttons to show depends on today's state.
  const visibleActions: AttendanceAction[] = log.checkOut
    ? []
    : !log.checkIn
    ? ['check-in']
    : openBreak
    ? ['break-end', 'check-out']
    : ['break-start', 'check-out'];

  /* ---------------- Flow control ---------------- */

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const reopenCamera = useCallback(() => {
    setAutoStart(false);
    timers.current.push(setTimeout(() => setAutoStart(true), 0));
  }, []);

  const cancelAction = useCallback(() => {
    clearTimers();
    setStage('idle');
    setResult(null);
    setPhoto(null);
    setPendingCapture(null);
    setAutoStart(false);
    setActionLocked(false);
  }, []);

  const commitEvent = useCallback(
    (event: AttendanceEvent) => {
      const updated = sortHistory([...history, event]);
      saveHistory(updated);
      setHistory(updated);
      return updated;
    },
    [history]
  );

  const handleActionChange = (next: AttendanceAction) => {
    if (flowActive && next !== action) return;

    if (next === 'check-out') {
      if (log.checkIn && !log.checkOut) setConfirmCheckout(true);
      return;
    }

    // Break Start / Break End: no camera, just the timer panel.
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

  // After check-in: no camera, show Break / Check Out.
  const afterCheckIn = useCallback(() => {
    clearTimers();
    setStage('idle');
    setResult(null);
    setPhoto(null);
    setPendingCapture(null);
    setAutoStart(false);
    setActionLocked(false);
    setAction('break-start');
  }, []);

  // After check-out: nothing left to mark today.
  const afterCheckOut = useCallback(() => {
    clearTimers();
    setStage('idle');
    setResult(null);
    setPhoto(null);
    setPendingCapture(null);
    setAutoStart(false);
    setActionLocked(false);
    setAction('check-in');
  }, []);

  const confirmCheckoutNow = async () => {
    try {
      await apiCheckOut();
      const at = new Date();
      commitEvent(newEvent(employee, 'check-out', at, null, null));
      setConfirmCheckout(false);
      setNotice(`${employee.name} checked out at ${formatTime(at.toISOString())}`);
      afterCheckOut();
    } catch (error) {
      setConfirmCheckout(false);
      setNotice(error instanceof Error ? error.message : 'Unable to check out');
    }
  };

  const markBreak = async (breakAction: AttendanceAction) => {
    if (!canPerform(breakAction, log).allowed) return;
    try {
      if (breakAction === 'break-start') await apiBreakStart();
      else await apiBreakEnd();

      const at = new Date();
      commitEvent(newEvent(employee, breakAction, at, null, null));
      setNotice(`${employee.name} ${ACTION_META[breakAction].verb} at ${formatTime(at.toISOString())}`);
      setAction(breakAction === 'break-start' ? 'break-end' : 'break-start');
      setStage('idle');
      setAutoStart(false);
      setActionLocked(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to update break');
    }
  };

  // Photo captured: it stays on screen until Submit.
  const handleCapture = useCallback((capture: CaptureResult) => {
    setPhoto(capture.dataUrl);
    setPendingCapture(capture);
    setStage('review');
    setAutoStart(false);
    setActionLocked(true);
  }, []);

  const handleRetake = useCallback(() => {
    setPhoto(null);
    setPendingCapture(null);
    setResult(null);
  }, []);

  // capture = null means "mark without a photo" (development only).
  const submitAttendance = useCallback(
    (capture: CaptureResult | null) => {
      setStage('verifying');

      const wait = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
      wait(700, () => setStage('matching'));

      wait(1800, async () => {
        try {
          let confidence: number | null = null;
          if (capture) {
            const verification = verifyFaceDemo(capture.metrics, employee.id);
            setResult(verification);
            if (!verification.ok) {
              setStage('failed');
              return;
            }
            confidence = verification.confidence;
          }

          const coords = await getCoords();
          const api = await apiCheckIn(capture?.dataUrl ?? null, employee.id, coords);

          const at = new Date();
          commitEvent(newEvent(employee, 'check-in', at, api.data?.checkInPhoto ?? null, confidence));

          setNotice(`${employee.name} checked in successfully${capture ? '' : ' (no photo)'}`);
          afterCheckIn();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to mark attendance';
          setResult({ ok: false, confidence: 0, message, employee: null });
          setNotice(message);
          setStage('failed');
        }
      });
    },
    [employee, commitEvent, afterCheckIn]
  );

  const handleSubmit = useCallback(() => {
    if (pendingCapture) submitAttendance(pendingCapture);
  }, [pendingCapture, submitAttendance]);

  const handleSkipPhoto = useCallback(() => submitAttendance(null), [submitAttendance]);

  /* ---------------- History (delete / clear are development only) ---------------- */

  const handleDelete = (id: string) => {
    const row = history.find((e) => e.id === id);
    const updated = history.filter((e) => e.id !== id);
    saveHistory(updated);
    setHistory(updated);
    if (row) setNotice(`Removed from this screen: ${ACTION_META[row.action].label}. The server record is unchanged.`);
  };

  const handleClearAll = () => {
    saveHistory([]);
    setHistory([]);
    setNotice('Local history cleared. The server record is unchanged.');
  };

  const handleProfileSave = (updated: Employee) => {
    setEmployee(updated);
    saveProfile(updated);
    setEditOpen(false);
  };

  /* ---------------- Render ---------------- */

  return (
    <div className={styles.page}>
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

      <div className={styles.mobileIdentity}>
        <EmployeeDetailsCard
          employee={employee}
          variant="compact"
          status={status}
          dateLabel={now ? formatDateChip(now) : ''}
          onEdit={() => setEditOpen(true)}
        />
      </div>

      <BreakTimerBar history={history} />

      {notice && (
        <p className={styles.notice} role="status">
          <Check size={16} aria-hidden />
          {notice}
        </p>
      )}

      {dayDone && (
        <p className={styles.notice} role="status">
          <Check size={16} aria-hidden /> You have checked out for today.
        </p>
      )}

      <div className={styles.layout}>
        <section className={styles.stepsColumn}>
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

        <section className={styles.mainCard}>
          <div className={styles.actionRow} role="tablist" aria-label="Attendance action">
            {visibleActions.map((a) => {
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
              Cancel {meta.label} and choose another action
            </button>
          )}

          <div className={styles.cameraColumn}>
            <h2 className={styles.mobileSectionTitle}>Capture Your Photo</h2>
            <p className={styles.mobileSectionSub}>
              Allow camera access and take a clear photo of your face to mark your attendance.
            </p>

            {photoRequired ? (
              <>
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

                {ALLOW_NO_PHOTO &&
                  action === 'check-in' &&
                  permission.allowed &&
                  !['verifying', 'matching'].includes(stage) && (
                    <button type="button" className={styles.changeActionBtn} onClick={handleSkipPhoto}>
                      Check in without photo (development only)
                    </button>
                  )}
              </>
            ) : (
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

          <div className={styles.historyCard}>
            <div className={styles.historyHead}>
              <h2 className={styles.historyTitle}>Attendance History ({history.length})</h2>
              {DEV && history.length > 0 && (
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
                      {DEV && <th scope="col">Delete</th>}
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
                          {DEV && (
                            <td>
                              <button
                                type="button"
                                className={styles.deleteBtn}
                                onClick={() => handleDelete(e.id)}
                                title="Remove this row from the screen (development only)"
                              >
                                <Trash2 size={15} />
                                <span className={styles.srOnly}>Delete record</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

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