import dayjs from 'dayjs';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export const DEPARTMENTS = [
  'Management',
  'Human Resources',
  'Marketing',
  'Creative',
  'Technology',
  'Sales',
  'Operations',
  'Finance',
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ['Low', 'Medium', 'High'] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface Employee {
  id: string;
  name: string;
  department: Department;
  designation: string;
  email: string;
  avatar: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // object URL now; replace with your storage URL (S3 / Cloudinary) later
}

export interface Task {
  id: string;
  title: string;
  description: string;
  employeeId: string;
  department: Department;
  priority: Priority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm (24h)
  attachments: TaskAttachment[];
  notify: boolean;
  assignedBy: string;
  createdAt: string; // ISO
  team?: string; // set when the task was assigned to a whole team
}

/* ------------------------------------------------------------------ */
/*  Employees                                                          */
/* ------------------------------------------------------------------ */

const portrait = (g: 'men' | 'women', n: number) =>
  `https://randomuser.me/api/portraits/${g}/${n}.jpg`;

export const EMPLOYEES: Employee[] = [
  { id: 'EMP-01', name: 'Priyangshu Mandal', department: 'Management', designation: 'Operations Manager', email: 'priyangshu@pavion.in', avatar: portrait('men', 32) },
  { id: 'EMP-02', name: 'Soumi Bhattacharya', department: 'Human Resources', designation: 'HR Executive', email: 'soumi@pavion.in', avatar: portrait('women', 44) },
  { id: 'EMP-03', name: 'Arindam Sen', department: 'Marketing', designation: 'Social Media Executive', email: 'arindam@pavion.in', avatar: portrait('men', 46) },
  { id: 'EMP-04', name: 'Neha Das', department: 'Creative', designation: 'Graphic Designer', email: 'neha@pavion.in', avatar: portrait('women', 65) },
  { id: 'EMP-05', name: 'Rohit Sharma', department: 'Technology', designation: 'Web Developer', email: 'rohit@pavion.in', avatar: portrait('men', 52) },
  { id: 'EMP-06', name: 'Ankita Roy', department: 'Sales', designation: 'Sales Executive', email: 'ankita@pavion.in', avatar: portrait('women', 68) },
  { id: 'EMP-07', name: 'Vikram Gupta', department: 'Operations', designation: 'Site Supervisor', email: 'vikram@pavion.in', avatar: portrait('men', 75) },
  { id: 'EMP-08', name: 'Pallabi Chatterjee', department: 'Finance', designation: 'Accounts Executive', email: 'pallabi@pavion.in', avatar: portrait('women', 79) },
  { id: 'EMP-09', name: 'Tanmoy Dutta', department: 'Management', designation: 'Project Coordinator', email: 'tanmoy@pavion.in', avatar: portrait('men', 11) },
  { id: 'EMP-10', name: 'Sneha Kundu', department: 'Human Resources', designation: 'Talent Acquisition', email: 'sneha@pavion.in', avatar: portrait('women', 21) },
  { id: 'EMP-11', name: 'Sourav Ghosh', department: 'Marketing', designation: 'Performance Marketer', email: 'sourav@pavion.in', avatar: portrait('men', 22) },
  { id: 'EMP-12', name: 'Riya Paul', department: 'Creative', designation: 'Video Editor', email: 'riya@pavion.in', avatar: portrait('women', 26) },
  { id: 'EMP-13', name: 'Amit Verma', department: 'Technology', designation: 'Full Stack Developer', email: 'amit@pavion.in', avatar: portrait('men', 36) },
  { id: 'EMP-14', name: 'Moumita Saha', department: 'Sales', designation: 'Business Development', email: 'moumita@pavion.in', avatar: portrait('women', 33) },
  { id: 'EMP-15', name: 'Debashis Kar', department: 'Operations', designation: 'Operations Executive', email: 'debashis@pavion.in', avatar: portrait('men', 41) },
  { id: 'EMP-16', name: 'Arjun Mehta', department: 'Finance', designation: 'Tax Consultant', email: 'arjun@pavion.in', avatar: portrait('men', 57) },
];

export const UNKNOWN_EMPLOYEE: Employee = {
  id: 'unknown',
  name: 'Unassigned',
  department: 'Management',
  designation: '',
  email: '',
  avatar: '',
};

export const getEmployee = (id: string): Employee =>
  EMPLOYEES.find((e) => e.id === id) ?? UNKNOWN_EMPLOYEE;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export const DATE_LABEL_FORMAT = 'ddd, D MMM YYYY';

export const formatDateLabel = (isoDate: string) => dayjs(isoDate).format(DATE_LABEL_FORMAT);

export const formatTime = (hhmm: string) => dayjs(`2000-01-01T${hhmm}`).format('hh:mm A');

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getInitials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/* ------------------------------------------------------------------ */
/*  Seed tasks (replace with your API later)                           */
/* ------------------------------------------------------------------ */

let seq = 0;
function seed(
  employeeId: string,
  title: string,
  priority: Priority,
  status: TaskStatus,
  dueDate: string,
  dueTime: string,
): Task {
  seq += 1;
  const emp = getEmployee(employeeId);
  return {
    id: `TSK-${1000 + seq}`,
    title,
    description: `Complete "${title}" and share an update with your reporting manager before the due time.`,
    employeeId,
    department: emp.department,
    priority,
    status,
    dueDate,
    dueTime,
    attachments: [],
    notify: true,
    assignedBy: 'Admin',
    createdAt: dayjs(dueDate).subtract(1, 'day').hour(10).minute(0).toISOString(),
  };
}

const SEP3 = '2026-09-03';
const SEP2 = '2026-09-02';
const SEP4 = '2026-09-04';
const SEP5 = '2026-09-05';

export const INITIAL_DATE = SEP3;

export const SEED_TASKS: Task[] = [
  // ---- Wed, 3 Sep 2026 (24 tasks: 14 completed, 6 in progress, 4 pending)
  seed('EMP-01', 'Prepare monthly marketing report', 'High', 'In Progress', SEP3, '11:00'),
  seed('EMP-02', 'Conduct interview for Social Media Executive', 'High', 'Pending', SEP3, '14:00'),
  seed('EMP-03', 'Create 3 social media posts', 'Medium', 'Completed', SEP3, '11:30'),
  seed('EMP-04', 'Design banner for new project', 'High', 'In Progress', SEP3, '13:00'),
  seed('EMP-05', 'Fix website bugs and updates', 'Medium', 'Completed', SEP3, '12:00'),
  seed('EMP-06', 'Follow up with 10 leads', 'Medium', 'Pending', SEP3, '16:00'),
  seed('EMP-07', 'Site visit report submission', 'Low', 'In Progress', SEP3, '17:00'),
  seed('EMP-08', 'Update expense tracker', 'Medium', 'Completed', SEP3, '11:00'),
  seed('EMP-09', 'Review weekly team targets', 'Medium', 'Completed', SEP3, '10:00'),
  seed('EMP-10', 'Update attendance records', 'Low', 'Completed', SEP3, '10:30'),
  seed('EMP-11', 'Schedule Meta ad campaign', 'High', 'Completed', SEP3, '12:30'),
  seed('EMP-12', 'Edit client reel for Instagram', 'High', 'In Progress', SEP3, '15:00'),
  seed('EMP-13', 'Deploy landing page to production', 'High', 'Completed', SEP3, '13:30'),
  seed('EMP-14', 'Send proposal to new client', 'Medium', 'Completed', SEP3, '14:30'),
  seed('EMP-15', 'Coordinate vendor delivery schedule', 'Medium', 'Completed', SEP3, '15:30'),
  seed('EMP-16', 'File GST return for August', 'High', 'Completed', SEP3, '16:30'),
  seed('EMP-03', 'Write captions for festive campaign', 'Low', 'Completed', SEP3, '17:30'),
  seed('EMP-04', 'Resize creatives for stories', 'Low', 'Completed', SEP3, '18:00'),
  seed('EMP-05', 'Optimize page speed on client site', 'Medium', 'Pending', SEP3, '18:30'),
  seed('EMP-06', 'Update CRM with call notes', 'Low', 'Completed', SEP3, '10:15'),
  seed('EMP-02', 'Prepare onboarding kit for new joiners', 'Medium', 'In Progress', SEP3, '11:45'),
  seed('EMP-11', 'Keyword research for blog topics', 'Medium', 'Completed', SEP3, '12:15'),
  seed('EMP-13', 'Renew SSL certificate', 'Low', 'Pending', SEP3, '09:30'),
  seed('EMP-08', 'Reconcile vendor payments', 'High', 'In Progress', SEP3, '16:15'),

  // ---- Tue, 2 Sep 2026
  seed('EMP-01', 'Plan quarterly review meeting', 'Medium', 'Completed', SEP2, '10:00'),
  seed('EMP-03', 'Reply to Instagram DMs', 'Low', 'Completed', SEP2, '12:00'),
  seed('EMP-04', 'Design festive offer poster', 'High', 'Completed', SEP2, '15:00'),
  seed('EMP-13', 'Fix contact form validation', 'Medium', 'In Progress', SEP2, '16:30'),
  seed('EMP-14', 'Call back warm leads', 'Medium', 'Pending', SEP2, '17:00'),

  // ---- Thu, 4 Sep 2026
  seed('EMP-11', 'Launch lead ad for website development', 'High', 'Pending', SEP4, '10:30'),
  seed('EMP-12', 'Shoot behind-the-scenes reel', 'Medium', 'Pending', SEP4, '12:00'),
  seed('EMP-05', 'Set up staging server', 'High', 'In Progress', SEP4, '13:00'),
  seed('EMP-10', 'Schedule interviews for designers', 'Medium', 'Pending', SEP4, '14:00'),
  seed('EMP-16', 'Prepare ITR documents checklist', 'Low', 'Pending', SEP4, '15:30'),
  seed('EMP-07', 'Inspect new co-working space setup', 'Medium', 'In Progress', SEP4, '17:00'),

  // ---- Fri, 5 Sep 2026
  seed('EMP-09', 'Share weekly progress summary', 'Medium', 'Pending', SEP5, '11:00'),
  seed('EMP-06', 'Visit two client offices', 'High', 'Pending', SEP5, '13:30'),
  seed('EMP-15', 'Order office supplies', 'Low', 'Pending', SEP5, '16:00'),
];
