'use client';

// src/app/dashboard/Attendance/components/BreakTimerBar.tsx
// Shows who is on a break right now, with a running timer and their employee ID.
// Renders nothing when nobody is on a break.
// Used on the Attendance dashboard and on the Mark Attendance page.
import { useEffect, useState } from 'react';
import { Coffee } from 'lucide-react';
import styles from './BreakTimerBar.module.css';
import { ActiveBreak, AttendanceEvent, activeBreaks, elapsedLabel, loadHistory } from '@/app/data/employeeData';

interface Props {
  // The Mark Attendance page passes its own history so the bar updates instantly.
  // On other pages leave it out and the bar reads the saved history itself.
  history?: AttendanceEvent[];
}

export default function BreakTimerBar({ history }: Props) {
  const [now, setNow] = useState<Date | null>(null);
  const [ownHistory, setOwnHistory] = useState<AttendanceEvent[]>([]);

  useEffect(() => {
    const tick = () => {
      setNow(new Date());
      if (!history) setOwnHistory(loadHistory());
    };
    const timer = window.setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      window.clearTimeout(timer);
      clearInterval(id);
    };
  }, [history]);

  if (!now) return null;

  const breaks: ActiveBreak[] = activeBreaks(history ?? ownHistory);
  if (breaks.length === 0) return null; // nothing to show when nobody is on a break

  return (
    <section className={styles.bar} aria-label="Employees on break">
      <span className={styles.barTitle}>
        <Coffee size={16} aria-hidden />
        On break ({breaks.length})
      </span>

      <ul className={styles.list}>
        {breaks.map((b) => (
          <li key={b.employeeId} className={styles.item}>
            <span className={styles.itemId}>{b.employeeId}</span>
            <span className={styles.itemName}>{b.employeeName}</span>
            <strong className={styles.itemClock}>{elapsedLabel(b.startedAt, now)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}