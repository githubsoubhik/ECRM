'use client';

import React from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  color: string;
  location?: string;
}

interface TodayScheduleProps {
  events: CalendarEvent[];
}

const TodaySchedule: React.FC<TodayScheduleProps> = ({ events }) => {
  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="today-schedule">
      <div className="schedule-header">
        <h3 className="schedule-title">TodayS Schedule</h3>
        <p className="schedule-date">
          {new Date(2026, 8, 3).toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}
        </p>
      </div>

      <div className="schedule-events">
        {sortedEvents.length > 0 ? (
          sortedEvents.map(event => (
            <div key={event.id} className="schedule-event">
              <div className="event-badge" style={{ backgroundColor: event.color }}>
                <span className="event-badge-icon">
                  {event.color === '#8B5CF6' ? '📹' : 
                   event.color === '#10B981' ? '☎️' : 
                   event.color === '#EC4899' ? '🎨' : '📅'}
                </span>
              </div>
              <div className="event-details">
                <div className="event-time-range">{event.time}</div>
                <div className="event-name">{event.title}</div>
                {event.location && (
                  <div className="event-location">{event.location}</div>
                )}
              </div>
              <button className="event-menu" aria-label="More options">
                ⋮
              </button>
            </div>
          ))
        ) : (
          <div className="no-events-message">
            No events scheduled today
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaySchedule;
