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

interface CalendarAgendaProps {
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
}

const CalendarAgenda: React.FC<CalendarAgendaProps> = ({ events, onDateClick }) => {
  const sortedEvents = [...events]
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

  const groupedEvents: Record<string, CalendarEvent[]> = {};

  sortedEvents.forEach(event => {
    if (!groupedEvents[event.date]) {
      groupedEvents[event.date] = [];
    }
    groupedEvents[event.date].push(event);
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="calendar-agenda-view">
      <div className="agenda-container">
        {Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <div key={date} className="agenda-day-group">
            <h3 className="agenda-date-header">
              {formatDate(date)}
            </h3>
            <div className="agenda-events">
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  className="agenda-event-item"
                  style={{ borderLeftColor: event.color }}
                  onClick={() => onDateClick(new Date(date))}
                  role="button"
                  tabIndex={0}
                >
                  <div className="agenda-event-left">
                    <div className="agenda-event-time">{event.time}</div>
                    <div
                      className="agenda-event-color-dot"
                      style={{ backgroundColor: event.color }}
                    ></div>
                  </div>
                  <div className="agenda-event-content">
                    <div className="agenda-event-title">{event.title}</div>
                    {event.location && (
                      <div className="agenda-event-location">{event.location}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {sortedEvents.length === 0 && (
          <div className="agenda-empty">
            No events scheduled
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarAgenda;
