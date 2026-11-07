'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Search,
  MoreVertical,
  Layout,
  Calendar,
  ChevronLeft,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle2,
  PlayCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
// import './TasksPage.css';

export default function TasksPage() {
  const router = useRouter();

  const handleTaskClick = (projectId: string) => {
    router.push(`/dashboard/Tasks/${projectId}`);
  };

  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 8)); // September 2026
  const [selectedDate, setSelectedDate] = useState<number | null>(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [selectedPriority, setSelectedPriority] = useState('All Priority');

  // Dashboard Summary Metrics
  const stats = [
    {
      label: 'Total Tasks',
      value: '42',
      icon: <CheckCircle2 size={18} className="stat-ic-blue" />,
      trend: '20%',
      isUp: true,
      trendText: 'vs last month',
      bgClass: 'stat-bg-blue',
    },
    {
      label: 'In Progress',
      value: '18',
      icon: <PlayCircle size={18} className="stat-ic-green" />,
      trend: '12%',
      isUp: true,
      trendText: 'vs last month',
      bgClass: 'stat-bg-green',
    },
    {
      label: 'Completed',
      value: '16',
      icon: <Clock size={18} className="stat-ic-orange" />,
      trend: '33%',
      isUp: true,
      trendText: 'vs last month',
      bgClass: 'stat-bg-orange',
    },
    {
      label: 'Overdue',
      value: '8',
      icon: <AlertCircle size={18} className="stat-ic-red" />,
      trend: '25%',
      isUp: false,
      trendText: 'vs last month',
      bgClass: 'stat-bg-red',
    },
  ];

  // Dummy Task Dataset
  const allTasks = [
    {
      id: '1',
      projectId: 'pmu-1001',
      name: 'Homepage Design',
      desc: 'Design hero section and layout',
      project: 'PureAyus Website',
      projectLogo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=60',
      client: 'PureAyus',
      clientLogo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=60',
      assignee: { name: 'John', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=60' },
      dueDate: '05 Sep 2026',
      priority: 'High',
      status: 'In Progress',
      createdBy: 'Pavion',
      assignedToMe: true,
      myTask: true,
    },
    {
      id: '2',
      projectId: 'pmu-1002',
      name: 'Social Media Strategy',
      desc: 'Q3 content plan',
      project: 'Social Media Campaign',
      projectLogo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=60',
      client: 'Zari Junction',
      clientLogo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=60',
      assignee: { name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&auto=format&fit=crop&q=60' },
      dueDate: '03 Sep 2026',
      priority: 'High',
      status: 'Overdue',
      createdBy: 'Pavion',
      assignedToMe: false,
      myTask: false,
    },
    {
      id: '3',
      projectId: 'pmu-1003',
      name: 'Logo Finalization',
      desc: 'Share final logo options',
      project: 'Brand Identity',
      projectLogo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&auto=format&fit=crop&q=60',
      client: 'Bcosmetics',
      clientLogo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&auto=format&fit=crop&q=60',
      assignee: { name: 'Mike', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&auto=format&fit=crop&q=60' },
      dueDate: '08 Sep 2026',
      priority: 'Medium',
      status: 'In Review',
      createdBy: 'Admin',
      assignedToMe: true,
      myTask: false,
    },
    {
      id: '4',
      projectId: 'pmu-1004',
      name: 'Product Photoshoot',
      desc: 'Lifestyle product shoot',
      project: 'Photoshoot',
      projectLogo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&auto=format&fit=crop&q=60',
      client: 'Ranitaz Makeover',
      clientLogo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&auto=format&fit=crop&q=60',
      assignee: { name: 'Emma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&auto=format&fit=crop&q=60' },
      dueDate: '10 Sep 2026',
      priority: 'Medium',
      status: 'Not Started',
      createdBy: 'Pavion',
      assignedToMe: false,
      myTask: false,
    },
    {
      id: '5',
      projectId: 'pmu-1005',
      name: 'Website Development',
      desc: 'Develop inner pages',
      project: 'PureAyus Website',
      projectLogo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=60',
      client: 'PureAyus',
      clientLogo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=60',
      assignee: { name: 'John', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=60' },
      dueDate: '12 Sep 2026',
      priority: 'High',
      status: 'In Progress',
      createdBy: 'Admin',
      assignedToMe: true,
      myTask: true,
    },
    {
      id: '6',
      projectId: 'pmu-1001',
      name: 'Content Writing',
      desc: 'Write service page content',
      project: 'Website SEO',
      projectLogo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&auto=format&fit=crop&q=60',
      client: 'The Style Studio',
      clientLogo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&auto=format&fit=crop&q=60',
      assignee: { name: 'Lisa', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&auto=format&fit=crop&q=60' },
      dueDate: '15 Sep 2026',
      priority: 'Low',
      status: 'Not Started',
      createdBy: 'Pavion',
      assignedToMe: false,
      myTask: true,
    },
    {
      id: '7',
      projectId: 'pmu-1002',
      name: 'Google Ads Setup',
      desc: 'Setup and configure ads',
      project: 'Ad Campaign',
      projectLogo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=60',
      client: 'Bcosmetics',
      clientLogo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=60',
      assignee: { name: 'John', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=60' },
      dueDate: '04 Sep 2026',
      priority: 'High',
      status: 'Overdue',
      createdBy: 'Admin',
      assignedToMe: true,
      myTask: false,
    },
    {
      id: '8',
      projectId: 'pmu-1005',
      name: 'Maintenance & Support',
      desc: 'Weekly website check',
      project: 'Ongoing Support',
      projectLogo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&auto=format&fit=crop&q=60',
      client: 'Nexa Group',
      clientLogo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&auto=format&fit=crop&q=60',
      assignee: { name: 'Lisa', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&auto=format&fit=crop&q=60' },
      dueDate: '18 Sep 2026',
      priority: 'Low',
      status: 'In Progress',
      createdBy: 'Pavion',
      assignedToMe: false,
      myTask: true,
    },
    {
      id: '9',
      projectId: 'pmu-1003',
      name: 'Client Meeting',
      desc: 'Discuss requirements',
      project: 'Project Planning',
      projectLogo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&auto=format&fit=crop&q=60',
      client: 'Lifestyle Decor',
      clientLogo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&auto=format&fit=crop&q=60',
      assignee: { name: 'John', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=60' },
      dueDate: '03 Sep 2026',
      priority: 'Medium',
      status: 'Completed',
      createdBy: 'Admin',
      assignedToMe: true,
      myTask: false,
    },
    {
      id: '10',
      projectId: 'pmu-1004',
      name: 'UI/UX Improvements',
      desc: 'Improve mobile responsiveness',
      project: 'Website Development',
      projectLogo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=60',
      client: 'Zari Junction',
      clientLogo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=60',
      assignee: { name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&auto=format&fit=crop&q=60' },
      dueDate: '20 Sep 2026',
      priority: 'Low',
      status: 'Not Started',
      createdBy: 'Pavion',
      assignedToMe: true,
      myTask: true,
    },
    {
      id: '11',
      projectId: 'pmu-1005',
      name: 'Security Patching',
      desc: 'Update dependencies and audit',
      project: 'Backend Security',
      projectLogo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&auto=format&fit=crop&q=60',
      client: 'Nexa Group',
      clientLogo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&auto=format&fit=crop&q=60',
      assignee: { name: 'John', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=60' },
      dueDate: '22 Sep 2026',
      priority: 'High',
      status: 'In Progress',
      createdBy: 'Pavion',
      assignedToMe: true,
      myTask: true,
    },
    {
      id: '12',
      projectId: 'pmu-1001',
      name: 'Payment Gateway Integration',
      desc: 'Stripe and PayPal integration',
      project: 'PureAyus Website',
      projectLogo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=60',
      client: 'PureAyus',
      clientLogo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=60',
      assignee: { name: 'Mike', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&auto=format&fit=crop&q=60' },
      dueDate: '25 Sep 2026',
      priority: 'High',
      status: 'Not Started',
      createdBy: 'Admin',
      assignedToMe: false,
      myTask: false,
    }
  ];

  const todaysTasks = [
    { id: 1, name: 'Client meeting with PureAyus', time: '11:00 AM - 12:00 PM', priority: 'High' },
    { id: 2, name: 'Review website design', time: '02:00 PM - 03:00 PM', priority: 'Medium' },
    { id: 3, name: 'Update project documentation', time: '04:00 PM - 05:00 PM', priority: 'Low' },
  ];

  const recentActivity = [
    {
      id: 1,
      name: 'Rohit',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=60',
      action: 'marked a task as completed',
      time: '2 hours ago'
    },
    {
      id: 2,
      name: 'Sneha',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&auto=format&fit=crop&q=60',
      action: 'updated the due date',
      time: '3 hours ago'
    },
    {
      id: 3,
      name: 'Aman',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&auto=format&fit=crop&q=60',
      action: 'added a new task',
      time: '5 hours ago'
    },
    {
      id: 4,
      name: 'Pooja',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&auto=format&fit=crop&q=60',
      action: 'changed task status to In Progress',
      time: '6 hours ago'
    },
  ];

  // Filtering Logic
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      // Tab filter
      if (selectedTab === 'my-tasks' && !task.myTask) return false;
      if (selectedTab === 'assigned-to-me' && !task.assignedToMe) return false;
      if (selectedTab === 'created-by-me' && task.createdBy !== 'Pavion') return false;

      // Project filter
      if (selectedProject !== 'All Projects' && task.project !== selectedProject) return false;

      // Priority filter
      if (selectedPriority !== 'All Priority' && task.priority !== selectedPriority) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          task.name.toLowerCase().includes(query) ||
          task.desc.toLowerCase().includes(query) ||
          task.project.toLowerCase().includes(query) ||
          task.client.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [selectedTab, selectedProject, selectedPriority, searchQuery]);

  // Dynamic Pagination Logic
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage);

  // Calendar Calculation Helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const monthDays = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const calendarDays = [];

  const prevMonthDays = getDaysInMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }

  for (let i = 1; i <= monthDays; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true });
  }

  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false });
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(paginatedTasks.map(t => t.id));
    } else {
      setSelectedRows([]);
    }
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="tasks-status-badge status-completed">• Completed</span>;
      case 'In Progress':
        return <span className="tasks-status-badge status-in-progress">• In Progress</span>;
      case 'In Review':
        return <span className="tasks-status-badge status-in-review">• In Review</span>;
      case 'Overdue':
        return <span className="tasks-status-badge status-overdue">• Overdue</span>;
      default:
        return <span className="tasks-status-badge status-not-started">• Not Started</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <span className="tasks-priority priority-high">• High</span>;
      case 'Medium':
        return <span className="tasks-priority priority-medium">• Medium</span>;
      case 'Low':
        return <span className="tasks-priority priority-low">• Low</span>;
      default:
        return <span className="tasks-priority">• Normal</span>;
    }
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="tasks-page-wrapper">
      {/* Header Bar */}
      <div className="tasks-page-header">
        <div className="tasks-header-left">
          <div className="tasks-breadcrumb">Dashboard &gt; Tasks</div>
          <h1 className="tasks-page-title">Tasks</h1>
          <p className="tasks-page-subtitle">Organize, track and complete your tasks efficiently.</p>
        </div>
        <div className="tasks-header-right">
          <div className="tasks-date-selector">
            <Calendar size={16} />
            <span>Tue, 3 Sep 2026</span>
            <ChevronDown size={14} />
          </div>
          <button className="tasks-add-btn">
            <Plus size={16} />
            <span>Add Task</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="tasks-container">
        {/* Main Section */}
        <div className="tasks-main-content">
          {/* Top Overview Cards */}
          <div className="tasks-stats-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="tasks-stat-card">
                <div className={`tasks-stat-icon ${stat.bgClass}`}>{stat.icon}</div>
                <div className="tasks-stat-info">
                  <div className="tasks-stat-value">{stat.value}</div>
                  <div className="tasks-stat-label">{stat.label}</div>
                  <div className={`tasks-stat-trend ${stat.isUp ? 'positive' : 'negative'}`}>
                    <span>{stat.isUp ? '↑' : '↓'} {stat.trend}</span>
                    <span className="tasks-trend-text">{stat.trendText}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls Bar & Table */}
          <div className="tasks-table-wrapper">
            <div className="tasks-toolbar">
              <div className="tasks-tabs">
                {[
                  { label: 'All Tasks', id: 'all' },
                  { label: 'My Tasks', id: 'my-tasks' },
                  { label: 'Assigned to Me', id: 'assigned-to-me' },
                  { label: 'Created by Me', id: 'created-by-me' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`tasks-tab ${selectedTab === tab.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedTab(tab.id);
                      setCurrentPage(1);
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="tasks-toolbar-actions">
                <select
                  className="tasks-filter-select"
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All Projects">All Projects</option>
                  <option value="PureAyus Website">PureAyus Website</option>
                  <option value="Social Media Campaign">Social Media Campaign</option>
                  <option value="Brand Identity">Brand Identity</option>
                </select>

                <select
                  className="tasks-filter-select"
                  value={selectedPriority}
                  onChange={(e) => {
                    setSelectedPriority(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All Priority">All Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <div className="tasks-search-box">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <button className="tasks-action-icon-btn">
                  <SlidersHorizontal size={14} />
                </button>
                <button className="tasks-action-icon-btn">
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>

            {/* Main Data Table */}
            <div className="tasks-table-container">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th className="tasks-col-checkbox">
                      <input
                        type="checkbox"
                        checked={paginatedTasks.length > 0 && selectedRows.length === paginatedTasks.length}
                        onChange={e => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="tasks-col-name">
                      Task Name <ArrowUpDown size={12} className="inline-icon" />
                    </th>
                    <th>Project</th>
                    <th>Client</th>
                    <th>Assignee</th>
                    <th>
                      Due Date <ArrowUpDown size={12} className="inline-icon" />
                    </th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th className="tasks-col-action">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTasks.length > 0 ? (
                    paginatedTasks.map(task => (
                      <tr 
                        key={task.id} 
                        className={selectedRows.includes(task.id) ? 'selected' : ''}
                        onClick={() => handleTaskClick(task.projectId)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td 
                          className="tasks-col-checkbox"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(task.id)}
                            onChange={() => toggleRowSelection(task.id)}
                          />
                        </td>
                        <td className="tasks-col-name">
                          <div className="tasks-task-info">
                            <div className="tasks-task-name">{task.name}</div>
                            <div className="tasks-task-desc">{task.desc}</div>
                          </div>
                        </td>
                        <td>
                          <div className="tasks-project-badge">
                            <img src={task.projectLogo} alt={task.project} className="tasks-badge-logo" />
                            <span className="tasks-badge-text">{task.project}</span>
                          </div>
                        </td>
                        <td>
                          <div className="tasks-client-badge">
                            <img src={task.clientLogo} alt={task.client} className="tasks-badge-logo" />
                            <span className="tasks-badge-text">{task.client}</span>
                          </div>
                        </td>
                        <td>
                          <div className="tasks-assignee">
                            <img src={task.assignee.avatar} alt={task.assignee.name} className="tasks-avatar" />
                          </div>
                        </td>
                        <td className={`tasks-due-date ${task.status === 'Overdue' ? 'text-red' : ''}`}>
                          {task.dueDate}
                        </td>
                        <td>{getPriorityBadge(task.priority)}</td>
                        <td>{getStatusBadge(task.status)}</td>
                        <td 
                          className="tasks-col-action"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button className="tasks-action-btn">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="tasks-no-data">
                        No matching tasks found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Interactive Dynamic Pagination */}
            <div className="tasks-pagination">
              <div className="tasks-pagination-info">
                Showing {filteredTasks.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
              </div>
              <div className="tasks-pagination-controls">
                <button
                  className="p-nav-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`p-num-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="p-nav-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={14} />
                </button>
                <select
                  className="tasks-per-page-select"
                  value={itemsPerPage}
                  onChange={e => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Section */}
        <div className="tasks-sidebar">
          {/* Month Calendar Component */}
          <div className="tasks-calendar-card">
            <div className="tasks-calendar-header">
              <h3>{monthName}</h3>
              <div className="tasks-calendar-nav">
                <button onClick={handlePrevMonth}>
                  <ChevronLeft size={14} />
                </button>
                <button onClick={handleNextMonth}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            <div className="tasks-calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="tasks-weekday">{day}</div>
              ))}
              {calendarDays.map((item, idx) => (
                <div
                  key={idx}
                  className={`tasks-calendar-day ${!item.isCurrentMonth ? 'other-month' : ''} ${
                    item.isCurrentMonth && item.day === selectedDate ? 'selected-date' : ''
                  }`}
                  onClick={() => item.isCurrentMonth && setSelectedDate(item.day)}
                >
                  {item.day}
                </div>
              ))}
            </div>
          </div>

          {/* Today's Tasks */}
          <div className="tasks-today-card">
            <div className="tasks-card-header">
              <h3>Todays Tasks</h3>
              <a href="#" className="tasks-view-all">View All</a>
            </div>
            <div className="tasks-today-list">
              {todaysTasks.map(task => (
                <div key={task.id} className="tasks-today-item">
                  <input type="checkbox" className="today-checkbox" />
                  <div className="tasks-today-info">
                    <div className="tasks-today-name">{task.name}</div>
                    <div className="tasks-today-time">{task.time}</div>
                  </div>
                  <span className={`tasks-today-badge priority-${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics Chart */}
          <div className="tasks-stats-card">
            <h3>Task Statistics</h3>
            <div className="tasks-donut-chart">
              <svg viewBox="0 0 120 120" className="tasks-donut-svg">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#2563eb" strokeWidth="12" strokeDasharray="110 300" strokeDashoffset="0" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="#16a34a" strokeWidth="12" strokeDasharray="90 300" strokeDashoffset="-115" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="#dc2626" strokeWidth="12" strokeDasharray="50 300" strokeDashoffset="-210" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="#94a3b8" strokeWidth="12" strokeDasharray="35 300" strokeDashoffset="-265" />
              </svg>
              <div className="tasks-donut-center">
                <div className="tasks-donut-value">42</div>
                <div className="tasks-donut-label">Total Tasks</div>
              </div>
            </div>
            <div className="tasks-stats-legend">
              <div className="tasks-legend-item">
                <span className="tasks-legend-dot" style={{ backgroundColor: '#2563eb' }}></span>
                <span className="legend-text">In Progress</span>
                <span className="tasks-legend-value">18</span>
              </div>
              <div className="tasks-legend-item">
                <span className="tasks-legend-dot" style={{ backgroundColor: '#16a34a' }}></span>
                <span className="legend-text">Completed</span>
                <span className="tasks-legend-value">16</span>
              </div>
              <div className="tasks-legend-item">
                <span className="tasks-legend-dot" style={{ backgroundColor: '#dc2626' }}></span>
                <span className="legend-text">Overdue</span>
                <span className="tasks-legend-value">8</span>
              </div>
              <div className="tasks-legend-item">
                <span className="tasks-legend-dot" style={{ backgroundColor: '#94a3b8' }}></span>
                <span className="legend-text">Not Started</span>
                <span className="tasks-legend-value">6</span>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="tasks-activity-card">
            <div className="tasks-card-header">
              <h3>Recent Activity</h3>
              <a href="#" className="tasks-view-all">View All</a>
            </div>
            <div className="tasks-activity-list">
              {recentActivity.map(activity => (
                <div key={activity.id} className="tasks-activity-item">
                  <img src={activity.avatar} alt={activity.name} className="tasks-activity-avatar" />
                  <div className="tasks-activity-info">
                    <div className="tasks-activity-text">
                      <strong>{activity.name}</strong> {activity.action}
                    </div>
                    <div className="tasks-activity-time">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}