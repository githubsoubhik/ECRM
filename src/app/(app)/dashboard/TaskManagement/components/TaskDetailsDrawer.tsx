'use client';

import dayjs from 'dayjs';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import CloseRounded from '@mui/icons-material/CloseRounded';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import {
  TASK_STATUSES,
  formatBytes,
  formatDateLabel,
  formatTime,
  getEmployee,
  type Task,
  type TaskStatus,
} from '@/app/data/taskManagementData';
import { EmployeeAvatar, PriorityChip, StatusChip } from './TaskBadges';
import styles from '../TaskManagement.module.css';

interface TaskDetailsDrawerProps {
  task: Task | null;
  isMobile: boolean;
  onClose: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

const statusBtnClass: Record<TaskStatus, string> = {
  Pending: styles.sPending,
  'In Progress': styles.sInProgress,
  Completed: styles.sCompleted,
};

export default function TaskDetailsDrawer({ task, isMobile, onClose, onStatusChange, onDelete }: TaskDetailsDrawerProps) {
  const employee = task ? getEmployee(task.employeeId) : null;

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={Boolean(task)}
      onClose={onClose}
      slotProps={{
        backdrop: { sx: { backdropFilter: 'blur(3px)', backgroundColor: 'rgba(17, 26, 61, 0.22)' } },
        paper: {
          sx: isMobile
            ? { borderRadius: '20px 20px 0 0', maxHeight: '90dvh' }
            : { width: 440, maxWidth: '100%' },
        },
      }}
    >
      {task && employee && (
        <div className={styles.details}>
          {isMobile && <span className={styles.sheetHandle} aria-hidden />}

          <div className={styles.dHead}>
            <span className={styles.dId}>{task.id}</span>
            <IconButton aria-label="Close details" onClick={onClose} size="small">
              <CloseRounded />
            </IconButton>
          </div>

          <h2 className={styles.dTitle}>{task.title}</h2>
          <div className={styles.dChips}>
            <StatusChip status={task.status} />
            <PriorityChip priority={task.priority} />
          </div>

          <div className={styles.dPerson}>
            <EmployeeAvatar employee={employee} size={48} />
            <div>
              <div className={styles.dPersonName}>{employee.name}</div>
              <div className={styles.dPersonSub}>{employee.designation}</div>
              {employee.email && (
                <a className={styles.dPersonMail} href={`mailto:${employee.email}`}>
                  {employee.email}
                </a>
              )}
            </div>
          </div>

          <dl className={styles.dInfo}>
            <div>
              <dt>Department</dt>
              <dd>{task.department}</dd>
            </div>
            <div>
              <dt>Assigned as</dt>
              <dd>{task.team ?? 'Individual task'}</dd>
            </div>
            <div>
              <dt>Due date</dt>
              <dd>{formatDateLabel(task.dueDate)}</dd>
            </div>
            <div>
              <dt>Due time</dt>
              <dd>{formatTime(task.dueTime)}</dd>
            </div>
            <div>
              <dt>Assigned by</dt>
              <dd>{task.assignedBy}</dd>
            </div>
            <div>
              <dt>Assigned on</dt>
              <dd>{dayjs(task.createdAt).format('D MMM YYYY, hh:mm A')}</dd>
            </div>
            <div>
              <dt>Notification</dt>
              <dd>{task.notify ? 'Email and in-app sent' : 'Not sent'}</dd>
            </div>
          </dl>

          <section className={styles.dSection}>
            <h3>Description</h3>
            <p>{task.description}</p>
          </section>

          <section className={styles.dSection}>
            <h3>Attachments ({task.attachments.length})</h3>
            {task.attachments.length === 0 ? (
              <p className={styles.dMuted}>No files attached to this task.</p>
            ) : (
              <ul className={styles.dFiles}>
                {task.attachments.map((f) => (
                  <li key={f.id}>
                    <InsertDriveFileOutlined fontSize="small" />
                    <span className={styles.dFileName}>{f.name}</span>
                    <span className={styles.dMuted}>{formatBytes(f.size)}</span>
                    <IconButton
                      size="small"
                      component="a"
                      href={f.url}
                      download={f.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Download ${f.name}`}
                    >
                      <DownloadRounded fontSize="small" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.dSection}>
            <h3>Update status</h3>
            <div className={styles.dStatusRow}>
              {TASK_STATUSES.map((s) => (
                <ButtonBase
                  key={s}
                  className={`${styles.dStatusBtn} ${task.status === s ? `${statusBtnClass[s]} ${styles.dStatusActive}` : ''}`}
                  aria-pressed={task.status === s}
                  onClick={() => onStatusChange(task.id, s)}
                >
                  {s}
                </ButtonBase>
              ))}
            </div>
          </section>

          <Button
            fullWidth
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlineRounded />}
            onClick={() => onDelete(task.id)}
            sx={{ mt: 1, height: 42 }}
          >
            Delete task
          </Button>
        </div>
      )}
    </Drawer>
  );
}
