'use client';

import Avatar from '@mui/material/Avatar';
import FlagRounded from '@mui/icons-material/FlagRounded';
import {
  getInitials,
  type Employee,
  type Priority,
  type TaskStatus,
} from '@/app/data/taskManagementData';
import styles from '../TaskManagement.module.css';

const priorityClass: Record<Priority, string> = {
  High: styles.pHigh,
  Medium: styles.pMedium,
  Low: styles.pLow,
};

const statusClass: Record<TaskStatus, string> = {
  Pending: styles.sPending,
  'In Progress': styles.sInProgress,
  Completed: styles.sCompleted,
};

const flagClass: Record<Priority, string> = {
  High: styles.flagHigh,
  Medium: styles.flagMedium,
  Low: styles.flagLow,
};

export function PriorityChip({ priority }: { priority: Priority }) {
  return <span className={`${styles.chip} ${priorityClass[priority]}`}>{priority}</span>;
}

export function StatusChip({ status }: { status: TaskStatus }) {
  return <span className={`${styles.chip} ${styles.statusChip} ${statusClass[status]}`}>{status}</span>;
}

export function PriorityFlag({ priority }: { priority: Priority }) {
  return (
    <span className={`${styles.flag} ${flagClass[priority]}`}>
      <FlagRounded fontSize="inherit" />
      {priority}
    </span>
  );
}

export function EmployeeAvatar({ employee, size = 36 }: { employee: Employee; size?: number }) {
  return (
    <Avatar
      src={employee.avatar || undefined}
      alt={employee.name}
      sx={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        fontWeight: 600,
        bgcolor: '#DCE7FA',
        color: '#12372F',
        flexShrink: 0,
      }}
    >
      {getInitials(employee.name)}
    </Avatar>
  );
}
