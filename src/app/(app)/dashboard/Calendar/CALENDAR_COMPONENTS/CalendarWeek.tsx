'use client';

import React from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  color: string;
}

interface CalendarWeekProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
}

const CalendarWeek: React.FC<CalendarWeekProps> = ({ currentDate, events, onDateClick }) => {
  const getWeekDates = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const weekStart = new Date(d.setDate(diff));
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const weekDates = getWeekDates(new Date(currentDate));

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date(2026, 8, 3);
    return date.toDateString() === today.toDateString();
  };

  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i < 12 ? i === 0 ? 12 : i : i === 12 ? 12 : i - 12;
    const period = i < 12 ? 'AM' : 'PM';
    return `${hour}:00 ${period}`;
  });

  const getEventPosition = (time: string) => {
    const [hourMin] = time.split(' ');
    const [hour] = hourMin.split(':');
    return parseInt(hour) * 4; // 4% per hour
  };

  return (
    <div className="calendar-week-view">
      <div className="week-header">
        <div className="time-column-header"></div>
        {weekDates.map((date, idx) => {
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const today = isToday(date);
          return (
            <div
              key={idx}
              className={`week-day-header ${isWeekend ? 'weekend' : ''} ${today ? 'today-header' : ''}`}
              onClick={() => onDateClick(date)}
              role="button"
              tabIndex={0}
            >
              <div className="week-day-name">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`week-day-number ${today ? 'today-highlight' : ''}`}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="week-grid">
        <div className="time-column">
          {hours.map((hour, idx) => (
            <div key={idx} className="time-slot">
              {hour}
            </div>
          ))}
        </div>

        {weekDates.map((date, dayIdx) => {
          const dayEvents = getEventsForDate(date);
          return (
            <div
              key={dayIdx}
              className="week-day-column"
              onClick={() => onDateClick(date)}
            >
              {hours.map((hour, hourIdx) => (
                <div key={hourIdx} className="hour-slot"></div>
              ))}
              {dayEvents.map((event, eventIdx) => (
                <div
                  key={event.id}
                  className="week-event"
                  style={{
                    backgroundColor: event.color,
                    top: `${getEventPosition(event.time)}px`,
                    opacity: 0.9
                  }}
                  title={event.title}
                >
                  <div className="week-event-time">{event.time}</div>
                  <div className="week-event-title">{event.title}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarWeek;
