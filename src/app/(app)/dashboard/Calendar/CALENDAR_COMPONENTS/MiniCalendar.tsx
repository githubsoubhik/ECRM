'use client';

import React, { useState } from 'react';

// Extended Event Interface for future modal use
export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  color?: string;
  time?: string;
}

interface MiniCalendarProps {
  currentDate?: Date;
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onAddEvent?: (event: Omit<CalendarEvent, 'id'>) => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({
  currentDate: initialDate = new Date(),
  events = [],
  onDateClick,
  // onAddEvent
}) => {
  // State for dynamic month/year navigation
  const [viewDate, setViewDate] = useState<Date>(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  /* =========================================================
     FORM STATE (Commented out per request)
     =========================================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('10:00');
  const [eventColor, setEventColor] = useState('#fbbf24');
  ========================================================= */

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleTodayClick = () => {
    const today = new Date();
    setViewDate(today);
    setSelectedDate(today);
    if (onDateClick) onDateClick(today);
  };

  // Date calculation utilities
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(viewDate);
  const firstDay = getFirstDayOfMonth(viewDate);
  const daysInPrevMonth = getDaysInMonth(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));

  interface CalendarDay {
    day: number;
    isCurrentMonth: boolean;
    date: Date;
  }

  const calendarDays: CalendarDay[] = [];

  // Previous month padding days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, day);
    calendarDays.push({ day, isCurrentMonth: false, date });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
    calendarDays.push({ day: i, isCurrentMonth: true, date });
  }

  // Next month padding days to reach 42 grid cells (6 rows)
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, i);
    calendarDays.push({ day: i, isCurrentMonth: false, date });
  }

  // Helper checks
  const isToday = (targetDate: Date) => {
    const today = new Date();
    return (
      targetDate.getDate() === today.getDate() &&
      targetDate.getMonth() === today.getMonth() &&
      targetDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (targetDate: Date) => {
    if (!selectedDate) return false;
    return (
      targetDate.getDate() === selectedDate.getDate() &&
      targetDate.getMonth() === selectedDate.getMonth() &&
      targetDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Filter events matching a specific cell's date
  const getEventsForDate = (targetDate: Date) => {
    return events.filter(
      (evt) =>
        new Date(evt.date).getDate() === targetDate.getDate() &&
        new Date(evt.date).getMonth() === targetDate.getMonth() &&
        new Date(evt.date).getFullYear() === targetDate.getFullYear()
    );
  };

  const handleCellClick = (dayObj: CalendarDay) => {
    setSelectedDate(dayObj.date);

    if (!dayObj.isCurrentMonth) {
      // Auto-switch view month if user clicks a muted padding day
      setViewDate(new Date(dayObj.date.getFullYear(), dayObj.date.getMonth(), 1));
    }

    if (onDateClick) {
      onDateClick(dayObj.date);
    }

    /* =========================================================
       MODAL TRIGGER ON DATE CLICK (Commented out per request)
       =========================================================
    setIsModalOpen(true);
    ========================================================= */
  };

  /* =========================================================
     FORM SUBMIT HANDLER (Commented out per request)
     =========================================================
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !selectedDate) return;

    if (onAddEvent) {
      onAddEvent({
        title: eventTitle,
        date: selectedDate,
        time: eventTime,
        color: eventColor,
      });
    }

    setEventTitle('');
    setIsModalOpen(false);
  };
  ========================================================= */

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthYear = viewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mini-calendar">
      {/* Header with Navigation Controls */}
      <div className="mini-calendar-header">
        <button
          type="button"
          className="mini-nav-btn"
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
          ‹
        </button>
        
        <div className="mini-title-wrapper">
          <h3 className="mini-calendar-title">{monthYear}</h3>
          {/* <button type="button" className="mini-today-badge" onClick={handleTodayClick}>
            Today
          </button> */}
        </div>

        <button
          type="button"
          className="mini-nav-btn"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="mini-calendar-weekdays">
        {weekDays.map((day) => (
          <div key={day} className="mini-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="mini-calendar-grid">
        {calendarDays.map((dayObj, idx) => {
          const dayEvents = getEventsForDate(dayObj.date);
          const activeToday = isToday(dayObj.date);
          const activeSelected = isSelected(dayObj.date);

          return (
            <div
              key={idx}
              className={`mini-calendar-day ${!dayObj.isCurrentMonth ? 'other-month' : ''} ${
                activeToday ? 'today' : ''
              } ${activeSelected && !activeToday ? 'selected' : ''}`}
              onClick={() => handleCellClick(dayObj)}
            >
              <span className="mini-day-number">{dayObj.day}</span>
              
              {/* Dynamic Event Dots Indicator */}
              {dayEvents.length > 0 && (
                <div className="mini-day-dots">
                  {dayEvents.slice(0, 3).map((evt, i) => (
                    <span
                      key={evt.id || i}
                      className="mini-event-dot"
                      style={{ backgroundColor: evt.color || '#3b82f6' }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* =========================================================
          EVENT FORM MODAL (Commented out per request)
          =========================================================
      {isModalOpen && (
        <div className="mini-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="mini-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mini-modal-header">
              <h4>Add Event for {selectedDate?.toLocaleDateString()}</h4>
              <button 
                className="mini-modal-close" 
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mini-modal-form">
              <div className="mini-form-group">
                <label>Event Title</label>
                <input
                  type="text"
                  placeholder="Meeting, Appointment..."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                />
              </div>

              <div className="mini-form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>

              <div className="mini-form-group">
                <label>Badge Color</label>
                <div className="mini-color-options">
                  {['#fbbf24', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      className={`color-picker-btn ${eventColor === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setEventColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="mini-modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      ========================================================= */}
    </div>
  );
};

export default MiniCalendar;