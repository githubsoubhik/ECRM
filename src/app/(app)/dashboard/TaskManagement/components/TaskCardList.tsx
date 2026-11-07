'use client';

import IconButton from '@mui/material/IconButton';
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import { formatTime, type Task } from '@/app/data/taskManagementData';
import { EmployeeAvatar, PriorityFlag, StatusChip } from './TaskBadges';
import type { TaskRow } from './TaskTable';
import styles from '../TaskManagement.module.css';

interface TaskCardListProps {
  rows: TaskRow[];
  onOpenActions: (anchor: HTMLElement, task: Task) => void;
  onOpenDetails: (task: Task) => void;
}

export default function TaskCardList({ rows, onOpenActions, onOpenDetails }: TaskCardListProps) {
  return (
    <ul className={styles.mList}>
      {rows.map((row) => (
        <li
          key={row.id}
          className={styles.mCard}
          role="button"
          tabIndex={0}
          onClick={() => onOpenDetails(row)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenDetails(row);
            }
          }}
        >
          <EmployeeAvatar employee={row.employee} size={52} />

          <div className={styles.mBody}>
            <div className={styles.mName}>{row.employee.name}</div>
            <div className={styles.mDept}>{row.department}</div>
            <div className={styles.mTitle}>{row.title}</div>
            <div className={styles.mMeta}>
              <span className={styles.mTime}>
                <AccessTimeRounded fontSize="inherit" />
                {formatTime(row.dueTime)}
              </span>
              <PriorityFlag priority={row.priority} />
            </div>
          </div>

          <div className={styles.mSide}>
            <StatusChip status={row.status} />
            <IconButton
              size="small"
              aria-label={`Actions for ${row.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenActions(e.currentTarget, row);
              }}
            >
              <MoreHorizRounded sx={{ color: '#161C3A' }} />
            </IconButton>
          </div>
        </li>
      ))}
    </ul>
  );
}
