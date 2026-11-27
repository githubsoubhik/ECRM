

'use client';

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

// 

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

import { useAttendance } from '@/app/customHook/useAttendance';


 

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


//const {attendance, loading: attLoading  } = useAttendance();

const {
  attendance,
  loading: attLoading,
  error,
  checkIn,
  checkOut,
  breakStart,
  breakEnd,
  refreshAttendance,
} = useAttendance();
  




  const [autoScan, setAutoScan] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  // The logged-in user is the only person who can mark here.
  //const selectedId = currentUser.id;
  const [employee, setEmployee] = useState<Employee>(currentUser);

 


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

 
  useEffect(() => {
    setEmployee(currentUser);
  }, [currentUser]);

  //console.log("currentUser-----------------------", currentUser, "------",employee);

  const employeeId = currentUser.id;




  const urlHandled = useRef(false);



  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // The notice clears itself.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  /* ---------------- Derived ---------------- */


type StateKey =
  | 'not_checked_in'
  | 'checked_in'
  | 'on_break'
  | 'checked_out';

const serverState = (
  attendance?.state ?? 'not_checked_in'
) as StateKey;

const ACTIONS_BY_STATE: Record<StateKey, AttendanceAction[]> = {
  not_checked_in: ['check-in'],
  checked_in: ['break-start', 'check-out'],
  on_break: ['break-end', 'check-out'],
  checked_out: [],
};

const DEFAULT_ACTION: Record<StateKey, AttendanceAction> = {
  not_checked_in: 'check-in',
  checked_in: 'break-start',
  on_break: 'break-end',
  checked_out: 'check-in',
};

// All action permissions come from the server response.
const canDo = (a: AttendanceAction): boolean => {
  const permissions: Record<AttendanceAction, boolean> = {
    'check-in': !!attendance?.canCheckIn,
    'check-out': !!attendance?.canCheckOut,
    'break-start': !!attendance?.canStartBreak,
    'break-end': !!attendance?.canEndBreak,
  };

  return permissions[a];
};

const visibleActions: AttendanceAction[] = attLoading
  ? []
  : ACTIONS_BY_STATE[serverState] ?? [];

const permission = {
  allowed: canDo(action),
  reason: 'This action is not available in the current attendance state.',
};

const status = attendance?.status ?? 'Not Marked';

const WORKING_LABEL: Record<StateKey, string> = {
  not_checked_in: 'Not Marked',
  checked_in: 'Checked In',
  on_break: 'On Break',
  checked_out: 'Checked Out',
};

const working = WORKING_LABEL[serverState];

const dayDone = serverState === 'checked_out';

const busy = ['review', 'verifying', 'matching'].includes(stage);
const flowActive = actionLocked || busy;

const meta = ACTION_META[action];
const photoRequired = needsPhoto(action);

// Open break comes directly from today's server record.
const openBreak =
  attendance?.breaks?.find(
    (b: { end?: string | null }) => !b.end
  ) ?? null;

// Summary comes directly from the server.
const summary = {
  checkIn: formatTime(attendance?.checkIn ?? null),
  checkOut: formatTime(attendance?.checkOut ?? null),
  breaks: durationLabel(attendance?.breakMinutes ?? 0),
  worked: durationLabel(attendance?.workMinutes ?? 0),
};


useEffect(() => {
  if (attLoading || urlHandled.current) return;

  const requested = params.get('action');

  urlHandled.current = true;

  if (!isAction(requested) || !canDo(requested)) {
    setAction(DEFAULT_ACTION[serverState]);
    return;
  }

  if (requested === 'check-out') {
    setConfirmCheckout(true);
    return;
  }

  setAction(requested);

  if (needsPhoto(requested)) {
    setActionLocked(true);
    setAutoStart(true);
  }
}, [attLoading, params, serverState]);





 



const history = useMemo<AttendanceEvent[]>(() => {
  if (!attendance?.checkIn) return [];

  const events: AttendanceEvent[] = [];

  events.push(
    newEvent(
      employee,
      'check-in',
      new Date(attendance.checkIn),
      attendance.checkInPhoto ?? null,
      null
    )
  );

  for (const b of attendance.breaks ?? []) {
    events.push(
      newEvent(employee, 'break-start', new Date(b.start), null, null)
    );

    if (b.end) {
      events.push(
        newEvent(employee, 'break-end', new Date(b.end), null, null)
      );
    }
  }

  if (attendance.checkOut) {
    events.push(
      newEvent(employee, 'check-out', new Date(attendance.checkOut), null, null)
    );
  }

  return events.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );
}, [attendance, employee]);

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

 
  const handleActionChange = (next: AttendanceAction) => {
  if (attLoading || !canDo(next)) return;

  if (flowActive && next !== action) return;

  if (next === 'check-out') {
    setConfirmCheckout(true);
    return;
  }

  // Break actions do not require camera.
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

  setAction(next);
  setActionLocked(true);
  setPhoto(null);
  setPendingCapture(null);
  setResult(null);
  setStage('idle');
  reopenCamera();
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
    if (!canDo('check-out')) return;

    await checkOut(); // POST + GET /today

    setConfirmCheckout(false);
    setNotice('Checked out successfully.');

    afterCheckOut();
  } catch (error) {
    setNotice(
      error instanceof Error
        ? error.message
        : 'Unable to check out'
    );
  }
};

  
  const markBreak = async (breakAction: AttendanceAction) => {
  if (!canDo(breakAction)) return;

  try {
    if (breakAction === 'break-start') {
      await breakStart();
    } else {
      await breakEnd();
    }

    setNotice(
      `${employee.name} ${ACTION_META[breakAction].verb} successfully.`
    );

    setStage('idle');
    setAutoStart(false);
    setActionLocked(false);
  } catch (error) {
    setNotice(
      error instanceof Error ? error.message : 'Unable to update break'
    );
  }
};
  
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



  const submitAttendance = useCallback(
  (capture: CaptureResult | null) => {
    setStage('verifying');

    const wait = (ms: number, fn: () => void) => {
      timers.current.push(setTimeout(fn, ms));
    };

    wait(700, () => setStage('matching'));

    wait(1800, async () => {
      try {
        if (capture) {
          const verification = verifyFaceDemo(
            capture.metrics,
            employeeId,
          );

          setResult(verification);

          if (!verification.ok) {
            setStage('failed');
            return;
          }
        }

        // Hook handles coordinates, POST, and GET refresh.
        await checkIn(capture?.dataUrl ?? null, employeeId);

        setNotice(
          `${employee.name} checked in successfully${capture ? '' : ' (no photo)'}`
        );

        setStage('idle');
        setPhoto(null);
        setPendingCapture(null);
        setAutoStart(false);
        setActionLocked(false);

        afterCheckIn();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to mark attendance';

        setResult({
          ok: false,
          confidence: 0,
          message,
          employee: null,
        });

        setNotice(message);
        setStage('failed');
      }
    });
  },
  [employee, checkIn, afterCheckIn]
);

  const handleSubmit = useCallback(() => {
    if (pendingCapture) submitAttendance(pendingCapture);
  }, [pendingCapture, submitAttendance]);

  const handleSkipPhoto = useCallback(() => submitAttendance(null), [submitAttendance]);

 
  const handleProfileSave = (updated: Employee) => {
    setEmployee(updated);
    saveProfile(updated);
    setEditOpen(false);
  };


if (attLoading) {
  return <div className={styles.page}>Loading attendance...</div>;
}

if (error) {
  return (
    <div className={styles.page}>
      <p>Unable to load attendance: {error}</p>
      <button
        type="button"
        onClick={() => refreshAttendance().catch(() => {})}
      >
        Retry
      </button>
    </div>
  );
}



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
              const allowed = canDo(a);
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
                  title={
                  lockedOut
                    ? 'Finish or cancel the current action first'
                    : allowed
                    ? ''
                    : 'This action is not available'
                }
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
                      {canDo('break-start')
                        ? 'The timer starts as soon as you tap the button below.'
                        : canDo('break-start')}
                    </p>
                  </>
                )}

                <button
                  type="button"
                  className={styles.breakBtn}
                  disabled={!canDo(openBreak ? 'break-end' : 'break-start')}
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
              {/* {DEV && history.length > 0 && (
                <button type="button" className={styles.clearBtn} onClick={handleClearAll}>
                  Clear all
                </button>
              )} */}
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
                      {/* {DEV && <th scope="col">Delete</th>} */}
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
                          {/* {DEV && (
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
                          )} */}
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


