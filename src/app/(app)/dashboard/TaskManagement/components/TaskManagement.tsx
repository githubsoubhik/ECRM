'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import dayjs, { type Dayjs } from 'dayjs';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import AddRounded from '@mui/icons-material/AddRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import FormatListBulletedRounded from '@mui/icons-material/FormatListBulletedRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import PriorityHighRounded from '@mui/icons-material/PriorityHighRounded';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import TaskAltRounded from '@mui/icons-material/TaskAltRounded';
import AutorenewRounded from '@mui/icons-material/AutorenewRounded';
import PendingActionsRounded from '@mui/icons-material/PendingActionsRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import {
  DATE_LABEL_FORMAT,
  DEPARTMENTS,
  EMPLOYEES,
  INITIAL_DATE,
  SEED_TASKS,
  TASK_STATUSES,
  getEmployee,
  type Department,
  type Task,
  type TaskStatus,
} from '@/app/data/taskManagementData';
import { DateSelect } from './Pickers';
import TaskTable, { type TaskRow } from './TaskTable';
import TaskCardList from './TaskCardList';
import Pager from './Pager';
import AssignTaskModal from './AssignTaskModal';
import TaskDetailsDrawer from './TaskDetailsDrawer';
import styles from '../TaskManagement.module.css';

const PAGE_SIZE = 8;

const statusMenuIcon: Record<TaskStatus, ReactNode> = {
  Pending: <PendingActionsRounded fontSize="small" />,
  'In Progress': <AutorenewRounded fontSize="small" />,
  Completed: <TaskAltRounded fontSize="small" />,
};

type Toast = { message: string; undo?: () => void };

export default function TaskManagement() {
  const isMobile = useMediaQuery('(max-width:768px)');

  // Data (swap SEED_TASKS for an API fetch later)
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);

  // Filters
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs(INITIAL_DATE));
  const [department, setDepartment] = useState<Department | 'all'>('all');
  const [employeeId, setEmployeeId] = useState<string>('all');
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  // Overlays
  const [assignOpen, setAssignOpen] = useState(false);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; taskId: string } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const dateKey = selectedDate.format('YYYY-MM-DD');

  /** Tasks for the selected date + department + employee (status filter excluded so the cards stay meaningful). */
  const scoped = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.dueDate === dateKey &&
          (department === 'all' || t.department === department) &&
          (employeeId === 'all' || t.employeeId === employeeId),
      ),
    [tasks, dateKey, department, employeeId],
  );

  const stats = useMemo(() => {
    const total = scoped.length;
    const count = (s: TaskStatus) => scoped.filter((t) => t.status === s).length;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    const completed = count('Completed');
    const inProgress = count('In Progress');
    const pending = count('Pending');
    return {
      total,
      completed,
      inProgress,
      pending,
      completedPct: pct(completed),
      inProgressPct: pct(inProgress),
      pendingPct: pct(pending),
    };
  }, [scoped]);

  const visible = useMemo(
    () => (status === 'all' ? scoped : scoped.filter((t) => t.status === status)),
    [scoped, status],
  );

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const rows: TaskRow[] = visible
    .slice(start, start + PAGE_SIZE)
    .map((t, i) => ({ ...t, rowNo: start + i + 1, employee: getEmployee(t.employeeId) }));

  const employeeOptions = department === 'all' ? EMPLOYEES : EMPLOYEES.filter((e) => e.department === department);
  const menuTask = menu ? tasks.find((t) => t.id === menu.taskId) ?? null : null;
  const detailTask = detailId ? tasks.find((t) => t.id === detailId) ?? null : null;

  /* ---------------- Handlers ---------------- */

  const handleDepartment = (value: Department | 'all') => {
    setDepartment(value);
    if (value !== 'all' && employeeId !== 'all' && getEmployee(employeeId).department !== value) {
      setEmployeeId('all');
    }
    setPage(1);
  };

  const handleAssign = (newTasks: Task[], summary: string) => {
    setTasks((prev) => [...newTasks, ...prev]); // newest on top so it shows on page 1
    setSelectedDate(dayjs(newTasks[0].dueDate)); // jump to the date it was assigned for
    setDepartment('all');
    setEmployeeId('all');
    setStatus('all');
    setPage(1);
    setToast({ message: `${summary} for ${dayjs(newTasks[0].dueDate).format(DATE_LABEL_FORMAT)}` });
  };

  const updateStatus = (taskId: string, next: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: next } : t)));
    setToast({ message: `Marked as ${next}` });
  };

  const deleteTask = (taskId: string) => {
    const index = tasks.findIndex((t) => t.id === taskId);
    const removed = tasks[index];
    if (!removed) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setDetailId(null);
    setToast({
      message: 'Task deleted',
      undo: () =>
        setTasks((prev) => {
          const copy = [...prev];
          copy.splice(index, 0, removed);
          return copy;
        }),
    });
  };

  const openActions = (anchor: HTMLElement, task: Task) => setMenu({ anchor, taskId: task.id });
  const openDetails = (task: Task) => setDetailId(task.id);

  /* ---------------- Render ---------------- */

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <ChevronRightRounded fontSize="inherit" />
        <span aria-current="page">Task Management</span>
      </nav>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Task Management</h1>
          <p className={styles.subtitle}>
            View and manage tasks for all employees.
            <span className={styles.subtitleExtra}> Select a date to see the tasks assigned for that day.</span>
          </p>
        </div>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => setAssignOpen(true)}
          sx={{
            flexShrink: 0,
            height: { xs: 42, md: 48 },
            px: { xs: 2, md: 3 },
            fontSize: { xs: 14, md: 14.5 },
            fontWeight: 500,
            borderRadius: '8px',
            boxShadow: '0 6px 16px rgba(18, 55, 47, 0.22)',
          }}
        >
          {isMobile ? 'Assign Task' : 'Assign New Task'}
        </Button>
      </header>

      {/* ---------------- Filters ---------------- */}
      <section className={styles.filters} aria-label="Task filters">
        <div className={styles.filterItem}>
          <span className={styles.filterLabel}>Select Date</span>
          <DateSelect
            value={selectedDate}
            showChevron
            onChange={(d) => {
              setSelectedDate(d);
              setPage(1);
            }}
          />
        </div>

        <div className={styles.filterItem}>
          <span className={styles.filterLabel} id="flt-dept">
            Department
          </span>
          <Select
            fullWidth
            value={department}
            onChange={(e) => handleDepartment(e.target.value as Department | 'all')}
            inputProps={{ 'aria-labelledby': 'flt-dept' }}
          >
            <MenuItem value="all">All Departments</MenuItem>
            {DEPARTMENTS.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </Select>
        </div>

        <div className={styles.filterItem}>
          <span className={styles.filterLabel} id="flt-emp">
            Employee
          </span>
          <Select
            fullWidth
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              setPage(1);
            }}
            inputProps={{ 'aria-labelledby': 'flt-emp' }}
            MenuProps={{ slotProps: { paper: { sx: { maxHeight: 320 } } } }}
          >
            <MenuItem value="all">All Employees</MenuItem>
            {employeeOptions.map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.name}
              </MenuItem>
            ))}
          </Select>
        </div>

        <div className={styles.filterItem}>
          <span className={styles.filterLabel} id="flt-status">
            Task Status
          </span>
          <Select
            fullWidth
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as TaskStatus | 'all');
              setPage(1);
            }}
            inputProps={{ 'aria-labelledby': 'flt-status' }}
          >
            <MenuItem value="all">All Status</MenuItem>
            {TASK_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </div>
      </section>

      {/* ---------------- Stat cards ---------------- */}
      <section className={styles.stats} aria-label="Task summary">
        <div className={`${styles.stat} ${styles.statBlue}`}>
          <span className={`${styles.statIcon} ${styles.iconBlue}`}>
            <FormatListBulletedRounded />
          </span>
          <div className={styles.statText}>
            <span className={styles.statLabel}>Total Tasks</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
        </div>

        <div className={`${styles.stat} ${styles.statGreen}`}>
          <span className={`${styles.statIcon} ${styles.iconGreen}`}>
            <span className={styles.iconSolid}>
              <CheckRounded />
            </span>
          </span>
          <div className={styles.statText}>
            <span className={styles.statLabel}>Completed</span>
            <span className={styles.statValue}>{stats.completed}</span>
          </div>
          <span className={`${styles.statPct} ${styles.statPctGreen}`}>
            <ArrowUpwardRounded fontSize="inherit" className={styles.trendArrow} />
            {stats.completedPct}%
          </span>
        </div>

        <div className={`${styles.stat} ${styles.statOrange}`}>
          <span className={`${styles.statIcon} ${styles.iconOrange}`}>
            <AccessTimeRounded />
          </span>
          <div className={styles.statText}>
            <span className={styles.statLabel}>In Progress</span>
            <span className={styles.statValue}>{stats.inProgress}</span>
          </div>
          <span className={styles.statPct}>{stats.inProgressPct}%</span>
        </div>

        <div className={`${styles.stat} ${styles.statRed}`}>
          <span className={`${styles.statIcon} ${styles.iconRed}`}>
            <span className={styles.iconSolid}>
              <PriorityHighRounded />
            </span>
          </span>
          <div className={styles.statText}>
            <span className={styles.statLabel}>Pending</span>
            <span className={styles.statValue}>{stats.pending}</span>
          </div>
          <span className={styles.statPct}>{stats.pendingPct}%</span>
        </div>
      </section>

      {/* ---------------- Task list ---------------- */}
      <section className={styles.tableCard}>
        <div className={styles.tableHead}>
          <h2 className={styles.tableTitle}>Tasks for {selectedDate.format(DATE_LABEL_FORMAT)}</h2>
          <span className={styles.taskCount}>
            {visible.length} {visible.length === 1 ? 'Task' : 'Tasks'}
          </span>
        </div>

        {visible.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No tasks match this date and these filters.</p>
            <p className={styles.emptyHint}>Pick another date, clear a filter, or assign a new task.</p>
            <Button variant="outlined" startIcon={<AddRounded />} onClick={() => setAssignOpen(true)}>
              Assign New Task
            </Button>
          </div>
        ) : isMobile ? (
          <TaskCardList rows={rows} onOpenActions={openActions} onOpenDetails={openDetails} />
        ) : (
          <TaskTable rows={rows} onOpenActions={openActions} onOpenDetails={openDetails} />
        )}
      </section>

      {visible.length > 0 && (
        <div className={styles.footer}>
          <span className={styles.showing}>
            Showing {start + 1} to {start + rows.length} of {visible.length} tasks
          </span>
          <Pager page={currentPage} pageCount={pageCount} onChange={setPage} />
        </div>
      )}

      {/* ---------------- Row actions (⋯) ---------------- */}
      <Menu
        anchorEl={menu?.anchor}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { borderRadius: '10px', minWidth: 210, boxShadow: '0 14px 36px rgba(17, 26, 61, 0.14)' },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menu) setDetailId(menu.taskId);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <VisibilityOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>View details</ListItemText>
        </MenuItem>
        <Divider />
        {TASK_STATUSES.filter((s) => s !== menuTask?.status).map((s) => (
          <MenuItem
            key={s}
            onClick={() => {
              if (menu) updateStatus(menu.taskId, s);
              setMenu(null);
            }}
          >
            <ListItemIcon>{statusMenuIcon[s]}</ListItemIcon>
            <ListItemText>Mark as {s}</ListItemText>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          sx={{ color: '#E0364F' }}
          onClick={() => {
            if (menu) deleteTask(menu.taskId);
            setMenu(null);
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <DeleteOutlineRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete task</ListItemText>
        </MenuItem>
      </Menu>

      {/* ---------------- Overlays ---------------- */}
      <AssignTaskModal
        open={assignOpen}
        isMobile={isMobile}
        defaultDate={selectedDate}
        onClose={() => setAssignOpen(false)}
        onAssign={handleAssign}
      />

      <TaskDetailsDrawer
        task={detailTask}
        isMobile={isMobile}
        onClose={() => setDetailId(null)}
        onStatusChange={updateStatus}
        onDelete={deleteTask}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={(_, reason) => reason !== 'clickaway' && setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'right' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setToast(null)}
          sx={{ bgcolor: '#12372F', alignItems: 'center' }}
          action={
            toast?.undo ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  toast.undo?.();
                  setToast(null);
                }}
              >
                Undo
              </Button>
            ) : undefined
          }
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
