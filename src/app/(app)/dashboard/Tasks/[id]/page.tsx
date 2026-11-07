'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tasksProjectsData, ProjectDetails } from '@/app/data/tasksProjectsData';
import styles from './page.module.css';

interface FileAttachment {
  id: string;
  name: string;
  size: string;
  date: string;
  type: 'pdf' | 'image' | 'document';
  icon?: string;
  url?: string;
}

interface ActivityItem {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  date: string;
  time: string;
  message: string;
  statusType?: 'Ongoing' | 'Forward for Reference';
  details?: Record<string, string>;
}

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const project: ProjectDetails | undefined = tasksProjectsData[projectId];

  // State Declarations
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [tasks, setTasks] = useState(project?.tasks || []);
  const [commentText, setCommentText] = useState('');
  const [isProjectDetailsExpanded, setIsProjectDetailsExpanded] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>(project?.activities || []);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);

  // Form State - Ongoing
  const [ongoingForm, setOngoingForm] = useState({
    summary: '',
    timeRemaining: '',
    blockers: '',
    nextMilestone: '',
  });

  // Form State - Forward for Reference
  const [forwardForm, setForwardForm] = useState({
    problems: '',
    reason: '',
    suggestions: '',
    contacts: '',
    deliverables: '',
  });

  // File Upload State & Reference
  const [attachmentsList, setAttachmentsList] = useState<FileAttachment[]>(
    project?.attachments || []
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!project) {
    return (
      <div className={styles['task-details-page']}>
        <div className={styles['error-message']}>
          <h2>Project Not Found</h2>
          <p>The project you are looking for does not exist.</p>
          <button onClick={() => router.back()} className={styles['btn-back-small']}>
            ← Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  // --- Handlers ---
  const toggleTask = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles: FileAttachment[] = Array.from(files).map((file) => {
      let fileType: 'pdf' | 'image' | 'document' = 'document';
      if (file.type.includes('pdf')) {
        fileType = 'pdf';
      } else if (file.type.includes('image')) {
        fileType = 'image';
      }

      const sizeInMB = file.size / (1024 * 1024);
      const formattedSize =
        sizeInMB >= 1
          ? `${sizeInMB.toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        size: formattedSize,
        date: currentDate,
        type: fileType,
        url: URL.createObjectURL(file),
      };
    });

    setAttachmentsList((prev) => [...newFiles, ...prev]);
    event.target.value = '';
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachmentsList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDownload = (attachment: FileAttachment) => {
    if (attachment.url) {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name;
      link.click();
    } else {
      alert(`Downloading ${attachment.name}`);
    }
  };

  const handleOngoingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      author: {
        name: 'You',
        avatar: 'https://i.pravatar.cc/150?img=68',
      },
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: `Updated task status to Ongoing: ${ongoingForm.summary || 'Progress updated.'}`,
      statusType: 'Ongoing',
      details: {
        'Summary': ongoingForm.summary,
        'Estimated Time Left': ongoingForm.timeRemaining,
        'Blockers / Risks': ongoingForm.blockers,
        'Next Milestone': ongoingForm.nextMilestone,
      },
    };

    setActivities((prev) => [newActivity, ...prev]);
    setSelectedStatus('');
    setOngoingForm({ summary: '', timeRemaining: '', blockers: '', nextMilestone: '' });
  };

  const handleForwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      author: {
        name: 'You',
        avatar: 'https://i.pravatar.cc/150?img=68',
      },
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: `Forwarded task for reference: ${forwardForm.reason || 'Handover details submitted.'}`,
      statusType: 'Forward for Reference',
      details: {
        'Roadblocks / Problems': forwardForm.problems,
        'Forwarding Reason': forwardForm.reason,
        'Suggestions for Next Lead': forwardForm.suggestions,
        'Key Contacts': forwardForm.contacts,
        'Pending Deliverables': forwardForm.deliverables,
      },
    };

    setActivities((prev) => [newActivity, ...prev]);
    setSelectedStatus('');
    setForwardForm({ problems: '', reason: '', suggestions: '', contacts: '', deliverables: '' });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const now = new Date();
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      author: {
        name: 'You',
        avatar: 'https://i.pravatar.cc/150?img=68',
      },
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: commentText,
    };

    setActivities((prev) => [newActivity, ...prev]);
    setCommentText('');
  };

  return (
    <div className={styles['task-details-page']}>
      {/* Top Navigation / Breadcrumb */}
      <div className={styles['header-top']}>
        <div className={styles['breadcrumb']}>
          <span>Dashboard</span>
          <span className={styles['separator']}>&gt;</span>
          <span>Tasks</span>
          <span className={styles['separator']}>&gt;</span>
          <span className={styles['current']}>Task Details</span>
        </div>
        <div className={styles['header-actions']}>
          <button onClick={() => router.back()} className={styles['btn-back-small']}>
            &lt; Back to Tasks
          </button>
          <button className={styles['btn-more']}>⋮</button>
        </div>
      </div>

      {/* Main Title & Tag */}
      <div className={styles['title-section']}>
        <h1>{project.title}</h1>
        <div className={styles['meta-info']}>
          <span className={styles['priority-badge']}>
            ★ {project.priority} Priority
          </span>
          <span className={styles['task-id']}>Task ID: #{project.taskId}</span>
        </div>
      </div>

      {/* Main Container Grid */}
      <div className={styles['task-details-container']}>
        {/* LEFT COLUMN */}
        <div className={styles['left-section']}>
          {/* Task Information */}
          <section className={styles['section']}>
            <div className={styles['section-header']}>
              <span className={`${styles['section-icon']} ${styles['icon-blue']}`}>📋</span>
              <h2>Task Information</h2>
            </div>
            <p className={styles['section-content']}>{project.taskDescription}</p>
          </section>

          {/* Assigned By & Co-workers Grid */}
          <div className={styles['two-col-grid']}>
            <section className={styles['section']}>
              <div className={styles['section-header']}>
                <span className={`${styles['section-icon']} ${styles['icon-orange']}`}>👤</span>
                <h2>Assigned By</h2>
              </div>
              <div className={styles['assigned-content']}>
                <img
                  src={project.assignedBy.avatar}
                  alt={project.assignedBy.name}
                  className={styles['avatar-large']}
                />
                <div className={styles['assigned-info']}>
                  <h3>{project.assignedBy.name}</h3>
                  <p className={styles['role']}>{project.assignedBy.role}</p>
                  <p className={styles['team']}>{project.assignedBy.team}</p>
                </div>
              </div>
            </section>

            <section className={styles['section']}>
              <div className={styles['section-header']}>
                <span className={`${styles['section-icon']} ${styles['icon-green']}`}>👥</span>
                <h2>Co-workers</h2>
              </div>
              <div className={styles['co-workers-wrapper']}>
                <div className={styles['co-workers-list']}>
                  {project.coWorkers.slice(0, 3).map((worker, index) => (
                    <img
                      key={index}
                      src={worker.avatar}
                      alt={worker.name}
                      className={styles['co-worker-avatar']}
                      title={worker.name}
                    />
                  ))}
                  {project.coWorkers.length > 3 && (
                    <div className={styles['co-worker-more']}>
                      +{project.coWorkers.length - 3}
                    </div>
                  )}
                </div>
                <p className={styles['co-workers-text']}>Working together on this task</p>
              </div>
            </section>
          </div>

          {/* Project Details & Assigned Date Grid */}
          <div className={styles['two-col-grid']}>
            <section className={styles['section']}>
              <div className={styles['section-header']}>
                <span className={`${styles['section-icon']} ${styles['icon-purple']}`}>📁</span>
                <h2>Project Details</h2>
              </div>
              <div 
                className={`${styles['project-details-card']} ${styles['project-details-card-expandable']}`}
                onClick={() => setIsProjectDetailsExpanded(!isProjectDetailsExpanded)}
                role="button"
                tabIndex={0}
              >
                <div className={styles['project-brand-logo']}>
                  <span>{project.projectDetails.icon || '🌿'}</span>
                </div>
                <div className={styles['project-info']}>
                  <h3>{project.projectDetails.name}</h3>
                  <p>Client: {project.projectDetails.client}</p>
                  <p>Project Code: {project.projectDetails.projectCode}</p>
                </div>
                <span className={`${styles['arrow']} ${isProjectDetailsExpanded ? styles['arrow-expanded'] : ''}`}>
                  &gt;
                </span>
              </div>

              {/* Collapsible Expanded Information Panel */}
              {isProjectDetailsExpanded && (
                <div className={styles['project-expanded-panel']}>
                  <div className={styles['expanded-grid']}>
                    <div className={styles['expanded-item']}>
                      <span className={styles['expanded-label']}>Overall Status</span>
                      <span className={styles['status-pill']}>In Progress</span>
                    </div>
                    <div className={styles['expanded-item']}>
                      <span className={styles['expanded-label']}>Duration</span>
                      <span className={styles['expanded-value']}>Jan 2026 - Nov 2026</span>
                    </div>
                    <div className={styles['expanded-item']}>
                      <span className={styles['expanded-label']}>Budget</span>
                      <span className={styles['expanded-value']}>$45,000</span>
                    </div>
                    <div className={styles['expanded-item']}>
                      <span className={styles['expanded-label']}>Project Lead</span>
                      <span className={styles['expanded-value']}>Sarah Jenkins</span>
                    </div>
                  </div>
                  <div className={styles['expanded-description']}>
                    <span className={styles['expanded-label']}>Project Overview</span>
                    <p>
                      Comprehensive redesign and development milestone tracking aiming to scale the clients digital presence across primary Web and Mobile interfaces.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className={styles['section']}>
              <div className={styles['section-header']}>
                <span className={`${styles['section-icon']} ${styles['icon-blue']}`}>📅</span>
                <h2>Assigned Date</h2>
              </div>
              <div className={styles['assigned-date-block']}>
                <p className={styles['date-title']}>{project.assignedDate}</p>
                <p className={styles['time-subtitle']}>10:30 AM</p>
              </div>
            </section>
          </div>

          {/* Project Requirements */}
          <section className={styles['section']}>
            <div className={styles['section-header']}>
              <span className={`${styles['section-icon']} ${styles['icon-pink']}`}>📄</span>
              <h2>Project Requirements</h2>
            </div>
            <ul className={styles['requirements-list']}>
              {project.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </section>

          {/* Your Tasks / To-Do */}
          <section className={styles['section']}>
            <div className={styles['section-header']}>
              <span className={`${styles['section-icon']} ${styles['icon-purple-bg']}`}>☑</span>
              <h2>Your Tasks / To-Do</h2>
            </div>
            <div className={styles['tasks-list']}>
              {tasks.map((task) => (
                <label key={task.id} className={styles['task-item']}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className={styles['task-checkbox']}
                  />
                  <span className={`${styles['task-text']} ${task.completed ? styles['completed'] : ''}`}>
                    {task.title}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Additional Notes */}
          <section className={styles['section']}>
            <div className={styles['section-header']}>
              <span className={`${styles['section-icon']} ${styles['icon-yellow']}`}>📝</span>
              <h2>Additional Notes</h2>
            </div>
            <p className={styles['notes-content']}>{project.additionalNotes}</p>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles['right-section']}>
          {/* Task Status */}
          <section className={styles['section']}>
            <div className={styles['section-header']}>
              <span className={`${styles['section-icon']} ${styles['icon-blue']}`}>📈</span>
              <h2>Task Status</h2>
            </div>
            
            <div className={styles['status-button-group']}>
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'Complete' ? '' : 'Complete')}
                className={`${styles['status-btn']} ${styles['btn-complete']} ${
                  selectedStatus === 'Complete' ? styles['active-complete'] : ''
                }`}
              >
                ✔ Complete
              </button>
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'Ongoing' ? '' : 'Ongoing')}
                className={`${styles['status-btn']} ${styles['btn-ongoing']} ${
                  selectedStatus === 'Ongoing' ? styles['active-ongoing'] : ''
                }`}
              >
                ▶ Ongoing
              </button>
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'Forward for Reference' ? '' : 'Forward for Reference')}
                className={`${styles['status-btn']} ${styles['btn-forward']} ${
                  selectedStatus === 'Forward for Reference' ? styles['active-forward'] : ''
                }`}
              >
                ✈ Forward for Reference
              </button>
            </div>

            {/* Complete Status Pop-up Modal */}
            {selectedStatus === 'Complete' && (
              <div className={styles['modal-overlay']}>
                <div className={styles['modal-card']}>
                  <div className={styles['modal-icon']}>🎉</div>
                  <h3>Congratulations!</h3>
                  <p>
                    Fantastic job on finishing <strong>{project.title}</strong>! Your hard work and dedication paid off.
                  </p>
                  <button 
                    className={styles['btn-close-modal']}
                    onClick={() => setSelectedStatus('')}
                  >
                    Awesome!
                  </button>
                </div>
              </div>
            )}

            {/* Ongoing Status Details Form */}
            {selectedStatus === 'Ongoing' && (
              <form onSubmit={handleOngoingSubmit} className={styles['status-details-card']}>
                <div className={styles['status-card-header']}>
                  <h3 className={styles['status-card-title']}>Ongoing Project Progress</h3>
                  <button 
                    type="button"
                    className={styles['btn-close-card']} 
                    onClick={() => setSelectedStatus('')}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles['form-group']}>
                  <label>Current Status Summary</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Finalizing front-end integration"
                    value={ongoingForm.summary}
                    onChange={(e) => setOngoingForm({ ...ongoingForm, summary: e.target.value })}
                  />
                </div>
                <div className={styles['form-group']}>
                  <label>How much more time will it take to complete?</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 2 days, 5 hours remaining" 
                    value={ongoingForm.timeRemaining}
                    onChange={(e) => setOngoingForm({ ...ongoingForm, timeRemaining: e.target.value })}
                  />
                </div>
                <div className={styles['form-group']}>
                  <label>Current Blockers or Risks</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Waiting for API key approval" 
                    value={ongoingForm.blockers}
                    onChange={(e) => setOngoingForm({ ...ongoingForm, blockers: e.target.value })}
                  />
                </div>
                <div className={styles['form-group']}>
                  <label>Next Immediate Milestone</label>
                  <input 
                    type="text" 
                    placeholder="e.g., QA Testing phase setup" 
                    value={ongoingForm.nextMilestone}
                    onChange={(e) => setOngoingForm({ ...ongoingForm, nextMilestone: e.target.value })}
                  />
                </div>
                <button type="submit" className={styles['btn-submit-status']}>
                  Update Ongoing Status
                </button>
              </form>
            )}

            {/* Forwarded Status Form */}
            {selectedStatus === 'Forward for Reference' && (
              <form onSubmit={handleForwardSubmit} className={styles['status-details-card']}>
                <div className={styles['status-card-header']}>
                  <h3 className={styles['status-card-title']}>Handover & Forward Details</h3>
                  <button 
                    type="button"
                    className={styles['btn-close-card']} 
                    onClick={() => setSelectedStatus('')}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles['form-group']}>
                  <label>Where did you face problems?</label>
                  <textarea 
                    rows={2} 
                    placeholder="Detail technical or process roadblocks encountered..."
                    value={forwardForm.problems}
                    onChange={(e) => setForwardForm({ ...forwardForm, problems: e.target.value })}
                  ></textarea>
                </div>
                <div className={styles['form-group']}>
                  <label>Reason for forwarding this project</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Needs specialized backend expertise" 
                    value={forwardForm.reason}
                    onChange={(e) => setForwardForm({ ...forwardForm, reason: e.target.value })}
                  />
                </div>
                <div className={styles['form-group']}>
                  <label>Suggestions for the next lead team</label>
                  <textarea 
                    rows={2} 
                    placeholder="Provide helpful tips, context, or code references..."
                    value={forwardForm.suggestions}
                    onChange={(e) => setForwardForm({ ...forwardForm, suggestions: e.target.value })}
                  ></textarea>
                </div>
                <div className={styles['form-group']}>
                  <label>Key Contacts & Stakeholders to Reach Out To</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Sarah Jenkins (Lead Designer)" 
                    value={forwardForm.contacts}
                    onChange={(e) => setForwardForm({ ...forwardForm, contacts: e.target.value })}
                  />
                </div>
                <div className={styles['form-group']}>
                  <label>Pending Deliverables to Prioritize</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Database migration script" 
                    value={forwardForm.deliverables}
                    onChange={(e) => setForwardForm({ ...forwardForm, deliverables: e.target.value })}
                  />
                </div>
                <button type="submit" className={styles['btn-submit-forward']}>
                  Submit Handover Notes
                </button>
              </form>
            )}
          </section>

          {/* Time & Deadline */}
          <section className={styles['section']}>
            <div className={styles['section-header']}>
              <span className={`${styles['section-icon']} ${styles['icon-blue']}`}>⏰</span>
              <h2>Time & Deadline</h2>
            </div>
            <div className={styles['time-cards-grid']}>
              <div className={styles['time-card']}>
                <div className={styles['time-card-header']}>
                  <span className={styles['card-icon']}>📅</span>
                  <span className={styles['card-label']}>Time Limit</span>
                </div>
                <p className={styles['card-main-value']}>{project.estimatedHours} hrs</p>
              </div>

              <div className={`${styles['time-card']} ${styles['deadline-card']}`}>
                <div className={styles['time-card-header']}>
                  <span className={styles['card-icon-red']}>📅</span>
                  <span className={styles['card-label']}>Deadline</span>
                </div>
                <p className={styles['card-main-value']}>{project.dueDate}</p>
                <span className={styles['deadline-tag']}>12 days left</span>
              </div>
            </div>

            {/* Progress Display */}
            <div className={styles['progress-wrapper']}>
              <div className={styles['progress-bar-container']}>
                <div
                  className={styles['progress-fill']}
                  style={{ width: `${project.progressPercentage}%` }}
                ></div>
              </div>
              <span className={styles['progress-percentage-text']}>{project.progressPercentage}%</span>
            </div>
            <div className={styles['progress-subtext-info']}>
              <span>Estimated: {project.estimatedHours} hrs</span>
              <span className={styles['divider']}>|</span>
              <span>Spent: {project.spentHours} hrs</span>
              <span className={styles['divider']}>|</span>
              <span>Remaining: {project.remainingHours} hrs</span>
            </div>
          </section>

          {/* Attachments Section */}
          <section className={styles['section']}>
            <div className={styles['section-header']}>
              <span className={`${styles['section-icon']} ${styles['icon-blue']}`}>📎</span>
              <h2>Attachments</h2>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept=".pdf, .png, .jpg, .jpeg, .doc, .docx"
              multiple
            />

            {/* Clickable Upload Box */}
            <div className={styles['upload-box']} onClick={handleUploadClick}>
              <span className={styles['upload-cloud-icon']}>☁</span>
              <p className={styles['upload-title']}>Upload files</p>
              <p className={styles['upload-desc']}>PDF, PNG, JPG, DOC (Max 10MB)</p>
            </div>

            {/* Render Attachments */}
            <div className={styles['attachments-list']}>
              {attachmentsList.map((attachment) => (
                <div key={attachment.id} className={styles['attachment-row']}>
                  <div className={styles['file-type-icon']}>
                    {attachment.type === 'pdf' && '📄'}
                    {attachment.type === 'image' && '🖼'}
                    {attachment.type === 'document' && '📝'}
                  </div>
                  <div className={styles['attachment-info']}>
                    <p className={styles['file-name']}>{attachment.name}</p>
                    <p className={styles['file-meta']}>
                      {attachment.size} • {attachment.date}
                    </p>
                  </div>
                  <div className={styles['attachment-actions']}>
                    <button
                      className={styles['action-icon-btn']}
                      onClick={() => handleDownload(attachment)}
                      title="Download"
                    >
                      📥
                    </button>
                    <button
                      className={styles['action-icon-btn']}
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      title="Remove"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Activity / Comments */}
          <section className={styles['section']}>
            <div className={styles['section-header']}>
              <span className={`${styles['section-icon']} ${styles['icon-blue']}`}>💬</span>
              <h2>Activity / Comments</h2>
              <a href="#" className={styles['view-all-link']}>View All</a>
            </div>

            <div className={styles['activity-stream']}>
              {activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className={`${styles['activity-item']} ${activity.details ? styles['activity-item-clickable'] : ''}`}
                  onClick={() => {
                    if (activity.details) {
                      setExpandedActivityId(expandedActivityId === activity.id ? null : activity.id);
                    }
                  }}
                >
                  <img
                    src={activity.author.avatar}
                    alt={activity.author.name}
                    className={styles['activity-avatar']}
                  />
                  <div className={styles['activity-details']}>
                    <div className={styles['activity-author-line']}>
                      <span className={styles['author-name']}>{activity.author.name}</span>
                      {activity.statusType && (
                        <span className={`${styles['status-tag']} ${activity.statusType === 'Ongoing' ? styles['tag-ongoing'] : styles['tag-forward']}`}>
                          {activity.statusType}
                        </span>
                      )}
                      <span className={styles['activity-date']}>{activity.date}, {activity.time}</span>
                    </div>
                    <p className={styles['activity-text']}>{activity.message}</p>

                    {/* Collapsible Details Viewer */}
                    {activity.details && expandedActivityId === activity.id && (
                      <div className={styles['activity-submitted-details']}>
                        <h4>Submitted Information</h4>
                        {Object.entries(activity.details).map(([key, val]) => (
                          val ? (
                            <div key={key} className={styles['submitted-detail-row']}>
                              <strong>{key}:</strong> {val}
                            </div>
                          ) : null
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles['comment-input-box']}>
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button onClick={handleAddComment} className={styles['btn-send-comment']}>➤</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}