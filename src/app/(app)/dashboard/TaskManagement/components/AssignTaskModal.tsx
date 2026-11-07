'use client';

import { useRef, useState, type DragEvent, type FormEvent, type ReactNode } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import Dialog from '@mui/material/Dialog';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import Checkbox from '@mui/material/Checkbox';
import CloseRounded from '@mui/icons-material/CloseRounded';
import EditCalendarOutlined from '@mui/icons-material/EditCalendarOutlined';
import AttachFileRounded from '@mui/icons-material/AttachFileRounded';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CircleRounded from '@mui/icons-material/CircleRounded';
import {
  DEPARTMENTS,
  EMPLOYEES,
  PRIORITIES,
  formatBytes,
  getEmployee,
  type Department,
  type Priority,
  type Task,
  type TaskAttachment,
} from '@/app/data/taskManagementData';
import { DateSelect, TimeSelect } from './Pickers';
import { EmployeeAvatar } from './TaskBadges';
import styles from './AssignTaskModal.module.css';

const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_DESCRIPTION = 500;

type FieldKey = 'title' | 'department' | 'assignTo' | 'description' | 'dueDate' | 'dueTime';
type Errors = Partial<Record<FieldKey, string>>;

interface AssignTaskModalProps {
  open: boolean;
  isMobile: boolean;
  defaultDate: Dayjs;
  onClose: () => void;
  onAssign: (tasks: Task[], summary: string) => void;
}

const backdropSx = {
  backdropFilter: 'blur(5px)',
  WebkitBackdropFilter: 'blur(5px)',
  backgroundColor: 'rgba(17, 26, 61, 0.28)',
};

const priorityStyle: Record<Priority, string> = {
  Low: styles.prLow,
  Medium: styles.prMedium,
  High: styles.prHigh,
};

export default function AssignTaskModal({ open, isMobile, defaultDate, onClose, onAssign }: AssignTaskModalProps) {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState<Department | ''>('');
  const [assignTo, setAssignTo] = useState(''); // employee id or "team:<Department>"
  const [priority, setPriority] = useState<Priority>('Low');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Dayjs | null>(defaultDate);
  const [dueTime, setDueTime] = useState<Dayjs | null>(null);
  const [files, setFiles] = useState<TaskAttachment[]>([]);
  const [fileError, setFileError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [notify, setNotify] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Every time the modal opens, pre-fill the due date with the date selected on the dashboard
  // useEffect(() => {
  //   if (open) setDueDate(defaultDate);
  // }, [open, defaultDate]);

  const clearError = (key: FieldKey) => setErrors((prev) => ({ ...prev, [key]: undefined }));

  const resetForm = () => {
    setTitle('');
    setDepartment('');
    setAssignTo('');
    setPriority('Low');
    setDescription('');
    setDueDate(defaultDate);
    setDueTime(null);
    setFiles([]);
    setFileError('');
    setNotify(true);
    setErrors({});
  };

  const handleCancel = () => {
    files.forEach((f) => URL.revokeObjectURL(f.url));
    resetForm();
    onClose();
  };

  /* ---------------- Department / Assign To linkage ---------------- */

  const handleDepartmentChange = (value: Department) => {
    setDepartment(value);
    clearError('department');
    if (!assignTo) return;
    if (assignTo.startsWith('team:')) {
      if (assignTo.slice(5) !== value) setAssignTo('');
    } else if (getEmployee(assignTo).department !== value) {
      setAssignTo('');
    }
  };

  const handleAssignToChange = (value: string) => {
    setAssignTo(value);
    clearError('assignTo');
    if (value.startsWith('team:')) {
      setDepartment(value.slice(5) as Department);
    } else if (value) {
      setDepartment(getEmployee(value).department);
    }
    clearError('department');
  };

  const teamsToShow: readonly Department[] = department ? [department] : DEPARTMENTS;
  const employeesToShow = department ? EMPLOYEES.filter((e) => e.department === department) : EMPLOYEES;

  const assignOptions: ReactNode[] = [
    <ListSubheader key="teams-header">Teams</ListSubheader>,
    ...teamsToShow.map((d) => {
      const count = EMPLOYEES.filter((e) => e.department === d).length;
      return (
        <MenuItem key={`team:${d}`} value={`team:${d}`}>
          <span className={styles.optionRow}>
            <span className={styles.teamIcon}>
              <GroupsOutlined fontSize="small" />
            </span>
            <span className={styles.optionText}>
              {d} Team
              <small>{count} members</small>
            </span>
          </span>
        </MenuItem>
      );
    }),
    <ListSubheader key="employees-header">Employees</ListSubheader>,
    ...employeesToShow.map((e) => (
      <MenuItem key={e.id} value={e.id}>
        <span className={styles.optionRow}>
          <EmployeeAvatar employee={e} size={28} />
          <span className={styles.optionText}>
            {e.name}
            <small>{e.designation}</small>
          </span>
        </span>
      </MenuItem>
    )),
  ];

  /* ---------------- Attachments ---------------- */

  const addFiles = (list: FileList | File[]) => {
    const accepted: TaskAttachment[] = [];
    const rejected: string[] = [];
    Array.from(list).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ALLOWED_EXT.includes(ext)) rejected.push(`${file.name} (file type not supported)`);
      else if (file.size > MAX_FILE_SIZE) rejected.push(`${file.name} (larger than 10MB)`);
      else
        accepted.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
        });
    });
    setFiles((prev) => [...prev, ...accepted]);
    setFileError(rejected.length ? `Not added: ${rejected.join(', ')}` : '');
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((f) => f.id !== id);
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  /* ---------------- Submit ---------------- */

  const validate = (): Errors => {
    const next: Errors = {};
    if (!title.trim()) next.title = 'Enter a task title.';
    if (!department) next.department = 'Choose a department.';
    if (!assignTo) next.assignTo = 'Choose an employee or a team.';
    if (!description.trim()) next.description = 'Add a short description of the task.';
    if (!dueDate) next.dueDate = 'Pick a due date.';
    if (!dueTime) next.dueTime = 'Pick a due time.';
    return next;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate();
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    const isTeam = assignTo.startsWith('team:');
    const targets = isTeam
      ? EMPLOYEES.filter((emp) => emp.department === assignTo.slice(5))
      : [getEmployee(assignTo)];

    const createdAt = dayjs().toISOString();
    const batchId = Date.now();

    const newTasks: Task[] = targets.map((emp, i) => ({
      id: `TSK-${batchId}-${i + 1}`,
      title: title.trim(),
      description: description.trim(),
      employeeId: emp.id,
      department: emp.department,
      priority,
      status: 'Pending',
      dueDate: dueDate!.format('YYYY-MM-DD'),
      dueTime: dueTime!.format('HH:mm'),
      attachments: files,
      notify,
      assignedBy: 'Admin',
      createdAt,
      team: isTeam ? `${assignTo.slice(5)} Team` : undefined,
    }));

    const summary = isTeam
      ? `Task assigned to ${targets.length} members of the ${assignTo.slice(5)} team`
      : `Task assigned to ${targets[0].name}`;

    onAssign(newTasks, summary);
    resetForm(); // keep the object URLs alive: the tasks now own them
    onClose();
  };

  /* ---------------- UI ---------------- */

  const form = (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {isMobile && <span className={styles.handle} aria-hidden />}

      <header className={styles.header}>
        <span className={styles.headerIcon}>
          <EditCalendarOutlined />
        </span>
        <div className={styles.headerText}>
          <h2 className={styles.heading} id="assign-task-title">
            Assign New Task
          </h2>
          <p className={styles.subheading}>Create and assign a new task to an employee or a team.</p>
        </div>
        <IconButton aria-label="Close" onClick={handleCancel} className={styles.close}>
          <CloseRounded />
        </IconButton>
      </header>

      <div className={styles.body}>
        <div className={styles.grid}>
          {/* Task title */}
          <div className={styles.aTitle}>
            <label className={styles.label} htmlFor="task-title">
              Task Title <span>*</span>
            </label>
            <TextField
              id="task-title"
              fullWidth
              placeholder="Enter a clear and concise task title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearError('title');
              }}
              error={Boolean(errors.title)}
              helperText={errors.title}
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />
          </div>

          {/* Department */}
          <div className={styles.aDept}>
            <label className={styles.label} id="task-dept-label">
              Department <span>*</span>
            </label>
            <Select
              fullWidth
              displayEmpty
              labelId="task-dept-label"
              value={department}
              error={Boolean(errors.department)}
              onChange={(e) => handleDepartmentChange(e.target.value as Department)}
              renderValue={(v) => (v ? v : <span className={styles.placeholder}>Select Department</span>)}
            >
              {DEPARTMENTS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
            {errors.department && <p className={styles.error}>{errors.department}</p>}
          </div>

          {/* Assign To */}
          <div className={styles.aAssign}>
            <label className={styles.label} id="task-assign-label">
              Assign To <span>*</span>
            </label>
            <Select
              fullWidth
              displayEmpty
              labelId="task-assign-label"
              value={assignTo}
              error={Boolean(errors.assignTo)}
              onChange={(e) => handleAssignToChange(e.target.value)}
              MenuProps={{ slotProps: { paper: { sx: { maxHeight: 340, borderRadius: '10px' } } } }}
              renderValue={(v) => {
                if (!v) return <span className={styles.placeholder}>Select Employee</span>;
                if (v.startsWith('team:')) return `${v.slice(5)} Team`;
                const emp = getEmployee(v);
                return (
                  <span className={styles.selectedEmp}>
                    <EmployeeAvatar employee={emp} size={22} />
                    {emp.name}
                  </span>
                );
              }}
            >
              {assignOptions}
            </Select>
            {errors.assignTo && <p className={styles.error}>{errors.assignTo}</p>}
          </div>

          {/* Priority */}
          <div className={styles.aPriority}>
            <span className={styles.label} id="task-priority-label">
              Priority <span>*</span>
            </span>
            <div className={styles.priorityRow} role="radiogroup" aria-labelledby="task-priority-label">
              {PRIORITIES.map((p) => {
                const selected = priority === p;
                return (
                  <ButtonBase
                    key={p}
                    role="radio"
                    aria-checked={selected}
                    className={`${styles.priorityBtn} ${priorityStyle[p]} ${selected ? styles.prSelected : ''}`}
                    onClick={() => setPriority(p)}
                  >
                    {selected ? (
                      <CheckCircleRounded className={styles.prIcon} />
                    ) : (
                      <CircleRounded className={styles.prDot} />
                    )}
                    {p}
                  </ButtonBase>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className={styles.aDesc}>
            <label className={styles.label} htmlFor="task-desc">
              Description <span>*</span>
            </label>
            <div className={styles.descWrap}>
              <TextField
                id="task-desc"
                fullWidth
                multiline
                minRows={3}
                placeholder="Enter task details, expectations or any additional information..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value.slice(0, MAX_DESCRIPTION));
                  clearError('description');
                }}
                error={Boolean(errors.description)}
                slotProps={{ htmlInput: { maxLength: MAX_DESCRIPTION } }}
                sx={{
                  '& .MuiOutlinedInput-root': { padding: '10px 14px 24px' },
                  '& .MuiOutlinedInput-input': { padding: 0 },
                }}
              />
              <span className={styles.counter}>
                {description.length}/{MAX_DESCRIPTION}
              </span>
            </div>
            {errors.description && <p className={styles.error}>{errors.description}</p>}
          </div>

          {/* Due date */}
          <div className={styles.aDate}>
            <span className={styles.label}>
              Due Date <span>*</span>
            </span>
            <DateSelect
              value={dueDate}
              onChange={(d) => {
                setDueDate(d);
                clearError('dueDate');
              }}
              error={Boolean(errors.dueDate)}
              ariaLabel="Select due date"
            />
            {errors.dueDate && <p className={styles.error}>{errors.dueDate}</p>}
          </div>

          {/* Due time */}
          <div className={styles.aTime}>
            <span className={styles.label}>
              Due Time <span>*</span>
            </span>
            <TimeSelect
              value={dueTime}
              onChange={(t) => {
                setDueTime(t);
                clearError('dueTime');
              }}
              error={Boolean(errors.dueTime)}
            />
            {errors.dueTime && <p className={styles.error}>{errors.dueTime}</p>}
          </div>

          {/* Attachments */}
          <div className={styles.aFiles}>
            <span className={styles.label}>Attachments (Optional)</span>
            <div
              className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <AttachFileRounded className={styles.clip} />
              <div>
                <p className={styles.dropTitle}>
                  Drag &amp; drop files here or {isMobile ? 'tap' : 'click'} to upload
                </p>
                <p className={styles.dropHint}>Supports: PDF, DOC, DOCX, XLS, PNG, JPG (Max 10MB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
            {fileError && <p className={styles.error}>{fileError}</p>}
            {files.length > 0 && (
              <ul className={styles.fileList}>
                {files.map((f) => (
                  <li key={f.id} className={styles.fileItem}>
                    <InsertDriveFileOutlined fontSize="small" className={styles.fileIcon} />
                    <span className={styles.fileName}>{f.name}</span>
                    <span className={styles.fileSize}>{formatBytes(f.size)}</span>
                    <IconButton size="small" aria-label={`Remove ${f.name}`} onClick={() => removeFile(f.id)}>
                      <CloseRounded fontSize="small" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Notify */}
          <div className={styles.aNotify}>
            <label className={styles.notify}>
              <Checkbox
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                sx={{ p: 0, color: '#12372F', '&.Mui-checked': { color: '#12372F' } }}
              />
              <span>
                <span className={styles.notifyTitle}>Notify employee about this task</span>
                <span className={styles.notifyHint}>
                  An email and in-app notification will be sent to the selected employee.
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <Button
          onClick={handleCancel}
          sx={{
            height: 44,
            minWidth: 120,
            flex: { xs: 1, sm: 'none' },
            bgcolor: '#F1F3F7',
            color: '#161C3A',
            border: '1px solid #E3E6EE',
            '&:hover': { bgcolor: '#E7EAF1' },
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          sx={{ height: 44, minWidth: 150, flex: { xs: 1.6, sm: 'none' }, fontWeight: 600 }}
        >
          Assign Task
        </Button>
      </footer>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={handleCancel}
        slotProps={{
          backdrop: { sx: backdropSx },
          paper: {
            'aria-labelledby': 'assign-task-title',
            sx: { borderRadius: '20px 20px 0 0', maxHeight: '94dvh', overflow: 'hidden' },
          },
        }}
      >
        {form}
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth={false}
      aria-labelledby="assign-task-title"
      slotProps={{
        backdrop: { sx: backdropSx },
        paper: {
          sx: {
            width: 620,
            maxWidth: 'calc(100% - 32px)',
            maxHeight: 'calc(100% - 48px)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(17, 26, 61, 0.22)',
          },
        },
      }}
    >
      {form}
    </Dialog>
  );
}
