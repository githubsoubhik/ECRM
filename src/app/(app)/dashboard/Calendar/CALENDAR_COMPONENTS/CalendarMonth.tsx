'use client';

import React from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  color: string;
}

interface CalendarMonthProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
}

const CalendarMonth: React.FC<CalendarMonthProps> = ({ currentDate, events, onDateClick }) => {
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const daysInPrevMonth = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

  const calendarDays = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, daysInPrevMonth - i)
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
    });
  }

  // Next month days
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i)
    });
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date(2026, 8, 3);
    return date.toDateString() === today.toDateString();
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-month-view">
      <div className="month-header">
        {weekDays.map(day => (
          <div key={day} className="week-day-header">
            {day}
          </div>
        ))}
      </div>

      <div className="month-grid">
        {calendarDays.map((dayObj, idx) => {
          const dayEvents = getEventsForDate(dayObj.date);
          const today = isToday(dayObj.date);

          return (
            <div
              key={idx}
              className={`calendar-day-cell ${!dayObj.isCurrentMonth ? 'other-month' : ''} ${today ? 'today' : ''}`}
              onClick={() => onDateClick(dayObj.date)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onDateClick(dayObj.date);
                }
              }}
            >
              <div className="day-number">
                {dayObj.day}
              </div>
              <div className="day-events">
                {dayEvents.slice(0, 2).map(event => (
                  <div 
                    key={event.id}
                    className="event-item"
                    style={{ borderLeftColor: event.color }}
                    title={event.title}
                  >
                    <span className="event-time">{event.time.split(' ')[0]}</span>
                    <span className="event-title">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="event-more">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonth;
