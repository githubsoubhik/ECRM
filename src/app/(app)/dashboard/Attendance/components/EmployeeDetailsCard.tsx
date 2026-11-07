'use client';

// src/app/dashboard/Attendance/components/EmployeeDetailsCard.tsx
import React, { useState, useSyncExternalStore } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import styles from '../mark/mark.module.css';
import { Employee } from '@/app/data/employeeData';

interface Props {
  employee: Employee;
  variant: 'full' | 'compact';
  status: string;
  dateLabel: string;
  timeLabel?: string;
  onEdit: () => void;
}

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase();

// Helper hook for hydration check without triggering ESLint set-state-in-effect rule
const emptySubscribe = () => () => { };
function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function EmployeeDetailsCard({
  employee,
  variant,
  status,
  dateLabel,
  timeLabel,
  onEdit,
}: Props) {
  const isHydrated = useIsHydrated();
  const [imgFailed, setImgFailed] = useState(false);

  const showImg = Boolean(employee.photoUrl) && !imgFailed;

  const avatar = (
    <div className={styles.avatarWrapper}>
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={employee.photoUrl}
          alt={employee.name}
          className={styles.avatarImg}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className={styles.avatarFallback}>{initials(employee.name)}</div>
      )}
    </div>
  );

  if (!isHydrated) {
    return <div className={styles.employeeCardSkeleton} />;
  }

  if (variant === 'compact') {
    return (
      <div className={styles.identityStrip}>
        {avatar}
        <div className={styles.identityText}>
          <p className={styles.identityName}>{employee.name}</p>
          <p className={styles.identityMeta}>{employee.id}</p>
          <p className={styles.identityMeta}>{employee.designation}</p>
        </div>
        <div className={styles.identityRight}>
          <span className={`${styles.statusChip} ${styles[`status${status.replace(/\s+/g, '')}`] ?? ''}`}>
            <span className={styles.statusDot} />
            {status}
          </span>
          <span className={styles.identityDate}>
            <Calendar size={14} aria-hidden />
            {dateLabel}
          </span>
          <button type="button" className={styles.editBtn} onClick={onEdit}>
            Edit Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.employeeCard}>
      {/* Header */}
      <div className={styles.employeeHead}>
        <div className={styles.titleWrapper}>
          <h2 className={styles.employeeTitle}>Employee Details</h2>
          <div className={styles.titleUnderline} />
        </div>
        <button type="button" className={styles.editBtn} onClick={onEdit}>
          Edit Profile
        </button>
      </div>

      {/* Main Profile Info */}
      <div className={styles.employeeTop}>
        {avatar}
        <div className={styles.employeeMeta}>
          <h3 className={styles.employeeName}>{employee.name}</h3>
          <p className={styles.employeeId}>{employee.id}</p>
          <p className={styles.employeeRole}>{employee.designation}</p>
          <p className={styles.employeeTeam}>{employee.team}</p>
        </div>
      </div>

      {/* Structured Details List */}
      <ul className={styles.employeeFacts}>
        <li className={styles.factItem}>
          <div className={styles.factIcon}>
            <MapPin size={22} strokeWidth={1.8} />
          </div>
          <div className={styles.factContent}>
            <span className={styles.factLabel}>Office Location</span>
            <strong className={styles.factValue}>{employee.officeLocation}</strong>
          </div>
        </li>

        <li className={styles.factItem}>
          <div className={styles.factIcon}>
            <Calendar size={22} strokeWidth={1.8} />
          </div>
          <div className={styles.factContent}>
            <span className={styles.factLabel}>Today&apos;s Date</span>
            <strong className={styles.factValue}>{dateLabel}</strong>
          </div>
        </li>

        <li className={styles.factItem}>
          <div className={styles.factIcon}>
            <Clock size={22} strokeWidth={1.8} />
          </div>
          <div className={styles.factContent}>
            <span className={styles.factLabel}>Current Time</span>
            <strong className={styles.factValue}>{timeLabel ?? '--:--:--'}</strong>
          </div>
        </li>
      </ul>

      {/* Bottom Highlight Location Banner */}
      <div className={styles.locationBox}>
        <div className={styles.locationPinIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="70" fill="#1d61f2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#1d61f2" />
            <circle cx="12" cy="9" r="2.5" fill="#ffffff" />
          </svg>
        </div>
        <div className={styles.locationDetails}>
          <p className={styles.locationLabel}>You are marking attendance from</p>
          <p className={styles.locationValue}>{employee.officeLocation}</p>
          <button type="button" className={styles.locationLink}>
            Not at this location?
          </button>
        </div>
      </div>
    </div>
  );
}