'use client';

import React from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  color: string;
}

interface UpcomingEventsProps {
  events: CalendarEvent[];
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="upcoming-events">
      <div className="upcoming-header">
        <h3 className="upcoming-title">Upcoming Events</h3>
        <a href="#" className="view-all-link">View All</a>
      </div>

      <div className="upcoming-list">
        {events.length > 0 ? (
          events.map(event => (
            <div key={event.id} className="upcoming-item">
              <div
                className="upcoming-color-indicator"
                style={{ backgroundColor: event.color }}
              ></div>
              <div className="upcoming-content">
                <div className="upcoming-date">{formatDate(event.date)}</div>
                <div className="upcoming-event-title">{event.title}</div>
                <div className="upcoming-time">{event.time}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-upcoming">
            No upcoming events
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingEvents;
