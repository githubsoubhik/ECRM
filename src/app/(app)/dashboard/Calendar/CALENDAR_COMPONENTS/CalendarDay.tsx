'use client';

import React from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  color: string;
}

interface CalendarDayProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ currentDate, events, onDateClick }) => {
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events
      .filter(event => event.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const dayEvents = getEventsForDate(currentDate);

  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i < 12 ? i === 0 ? 12 : i : i === 12 ? 12 : i - 12;
    const period = i < 12 ? 'AM' : 'PM';
    return `${hour}:00 ${period}`;
  });

  const getEventPosition = (time: string) => {
    const [hourMin] = time.split(' ');
    const [hour] = hourMin.split(':');
    return parseInt(hour) * 60 + 20; // pixels from top
  };

  return (
    <div className="calendar-day-view">
      <div className="day-header">
        <div className="day-title">
          {currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        <button
          className="day-add-btn"
          onClick={() => onDateClick(currentDate)}
        >
          + Add Event
        </button>
      </div>

      <div className="day-schedule">
        <div className="time-column">
          {hours.map((hour, idx) => (
            <div key={idx} className="time-slot">
              {hour}
            </div>
          ))}
        </div>

        <div className="day-events-container">
          <div className="hours-grid">
            {hours.map((_, idx) => (
              <div key={idx} className="hour-slot"></div>
            ))}
          </div>

          {dayEvents.length > 0 ? (
            <div className="events-overlay">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="day-event-card"
                  style={{
                    backgroundColor: event.color,
                    top: `${getEventPosition(event.time)}px`
                  }}
                  title={event.title}
                >
                  <div className="day-event-time">{event.time}</div>
                  <div className="day-event-title">{event.title}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-events">
              No events scheduled for this day
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarDay;
