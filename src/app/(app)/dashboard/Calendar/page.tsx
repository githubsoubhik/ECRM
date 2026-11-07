'use client';

import React, { useState, useMemo } from 'react';
import EventForm from './CALENDAR_COMPONENTS/EventForm';
import CalendarMonth from './CALENDAR_COMPONENTS/CalendarMonth';
import CalendarWeek from './CALENDAR_COMPONENTS/CalendarWeek';
import CalendarDay from './CALENDAR_COMPONENTS/CalendarDay';
import CalendarAgenda from './CALENDAR_COMPONENTS/CalendarAgenda';
import TodaySchedule from './CALENDAR_COMPONENTS/TodaySchedule';
import UpcomingEvents from './CALENDAR_COMPONENTS/UpcomingEvents';
import MiniCalendar from './CALENDAR_COMPONENTS/MiniCalendar';
import './CALENDAR_COMPONENTS/Calendar.css';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  endTime?: string;
  location?: string;
  description?: string;
  color: string;
  type?: string;
}

type ViewType = 'Month' | 'Week' | 'Day' | 'Agenda';

// Helper function to convert any Date object into local YYYY-MM-DD string
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 3)); // Sep 3, 2026
  const [viewType, setViewType] = useState<ViewType>('Month');
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Team Meeting',
      time: '09:00 AM',
      date: '2026-09-01',
      location: 'Conference Room',
      color: '#4F46E5'
    },
    {
      id: '2',
      title: 'Client Call',
      time: '02:00 PM',
      date: '2026-09-01',
      location: 'Zoom',
      color: '#10B981'
    },
    {
      id: '3',
      title: 'Project Review',
      time: '11:00 AM',
      date: '2026-09-03',
      location: 'Meeting Room A',
      color: '#8B5CF6'
    },
    {
      id: '4',
      title: 'Design Discussion',
      time: '04:00 PM',
      date: '2026-09-04',
      location: 'Office',
      color: '#EC4899'
    },
    {
      id: '5',
      title: 'Content Planning',
      time: '10:30 AM',
      date: '2026-09-06',
      location: 'Office',
      color: '#F59E0B'
    },
    {
      id: '6',
      title: 'Client Presentation',
      time: '03:00 PM',
      date: '2026-09-09',
      location: 'Zoom',
      color: '#3B82F6'
    },
    {
      id: '7',
      title: 'Website QA',
      time: '11:00 AM',
      date: '2026-09-11',
      location: 'Office',
      color: '#10B981'
    },
    {
      id: '8',
      title: 'Team Sync',
      time: '09:30 AM',
      date: '2026-09-14',
      location: 'Zoom',
      color: '#4F46E5'
    },
    {
      id: '9',
      title: 'Design Approval',
      time: '02:00 PM',
      date: '2026-09-16',
      location: 'Office',
      color: '#F59E0B'
    },
    {
      id: '10',
      title: '1:1 with Manager',
      time: '11:00 AM',
      date: '2026-09-18',
      location: 'Office',
      color: '#8B5CF6'
    },
    {
      id: '11',
      title: 'Client Call',
      time: '10:00 AM',
      date: '2026-09-22',
      location: 'Zoom',
      color: '#10B981'
    },
    {
      id: '12',
      title: 'Project Update',
      time: '03:30 PM',
      date: '2026-09-22',
      location: 'Office',
      color: '#F59E0B'
    },
    {
      id: '13',
      title: 'Team Lunch',
      time: '12:00 PM',
      date: '2026-09-24',
      location: 'Restaurant',
      color: '#EC4899'
    },
    {
      id: '14',
      title: 'Strategy Meeting',
      time: '02:00 PM',
      date: '2026-09-25',
      location: 'Conference Room',
      color: '#F59E0B'
    },
    {
      id: '15',
      title: 'Client Follow-up',
      time: '04:00 PM',
      date: '2026-09-30',
      location: 'Office',
      color: '#10B981'
    },
    {
      id: '16',
      title: 'Monthly Report',
      time: '11:00 AM',
      date: '2026-09-28',
      location: 'Office',
      color: '#8B5CF6'
    },
    {
      id: '17',
      title: 'Project Review',
      time: '11:00 AM - 12:00 PM',
      date: '2026-09-03',
      location: 'Google Meet',
      color: '#8B5CF6'
    },
    {
      id: '18',
      title: 'Client Call - Purevyus',
      time: '02:00 PM - 03:00 PM',
      date: '2026-09-03',
      location: 'Zoom Meeting',
      color: '#10B981'
    },
    {
      id: '19',
      title: 'Design Discussion',
      time: '04:00 PM - 05:00 PM',
      date: '2026-09-03',
      location: 'Office Meeting Room',
      color: '#EC4899'
    }
  ]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowEventForm(true);
  };

  const handleAddEvent = () => {
    setSelectedDate(currentDate);
    setShowEventForm(true);
  };

  const handleEventSubmit = (eventData: Omit<CalendarEvent, 'id'>) => {
    // Ensures submitted dates are converted to standard local YYYY-MM-DD
    const formattedDate = typeof eventData.date === 'string' 
      ? formatLocalDate(new Date(eventData.date.replace(/-/g, '/'))) 
      : formatLocalDate(eventData.date);

    const newEvent: CalendarEvent = {
      ...eventData,
      date: formattedDate,
      id: Date.now().toString()
    };
    setEvents(prevEvents => [...prevEvents, newEvent]);
    setShowEventForm(false);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 8, 3));
  };

  // Unified Filter: Converts both target date and stored event dates safely to standard string format
  const todayEvents = useMemo(() => {
    const todayStr = formatLocalDate(currentDate);

    return events.filter(event => {
      if (!event.date) return false;

      // Extract pure YYYY-MM-DD regardless of whether event.date is ISO or plain date string
      const eventDateStr = event.date.includes('T') 
        ? formatLocalDate(new Date(event.date))
        : event.date.split(' ')[0];

      return eventDateStr === todayStr;
    });
  }, [events, currentDate]);

  const upcomingEvents = useMemo(() => {
    const todayStr = formatLocalDate(currentDate);
    return events
      .filter(event => {
        const eventDateStr = event.date.includes('T') 
          ? formatLocalDate(new Date(event.date))
          : event.date.split(' ')[0];
        return eventDateStr >= todayStr;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [events, currentDate]);

  return (
    <div className="calendar-container">
      <div className="calendar-main">
        <div className="calendar-header">
          <div className="header-content">
            <h1 className="calendar-title">Calendar</h1>
            <p className="calendar-subtitle">Plan your schedule, stay organized and never miss an important event.</p>
          </div>
          <button className="add-event-btn" onClick={handleAddEvent}>
            <span className="plus-icon">+</span> Add Event
          </button>
        </div>

        <div className="view-controls">
          <div className="view-tabs">
            {(['Month', 'Week', 'Day', 'Agenda'] as ViewType[]).map(view => (
              <button
                key={view}
                className={`view-tab ${viewType === view ? 'active' : ''}`}
                onClick={() => setViewType(view)}
              >
                {view}
              </button>
            ))}
          </div>

          <div className="calendar-controls">
            <div className="date-controls">
              <button className="nav-btn" onClick={handlePrevMonth} title="Previous">
                &lt;
              </button>
              <span className="current-month">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button className="nav-btn" onClick={handleNextMonth} title="Next">
                &gt;
              </button>
            </div>
            <button className="today-btn" onClick={handleToday}>Today</button>
            <select className="date-picker">
              <option value="">
                {currentDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit' 
                })}
              </option>
            </select>
          </div>
        </div>

        <div className="calendar-view">
          {viewType === 'Month' && (
            <CalendarMonth 
              currentDate={currentDate} 
              events={events}
              onDateClick={handleDateClick}
            />
          )}
          {viewType === 'Week' && (
            <CalendarWeek 
              currentDate={currentDate} 
              events={events}
              onDateClick={handleDateClick}
            />
          )}
          {viewType === 'Day' && (
            <CalendarDay 
              currentDate={currentDate} 
              events={events}
              onDateClick={handleDateClick}
            />
          )}
          {viewType === 'Agenda' && (
            <CalendarAgenda 
              events={events}
              onDateClick={handleDateClick}
            />
          )}
        </div>
      </div>

      <div className="calendar-sidebar">
        <div className="sidebar-top">
          <MiniCalendar 
            currentDate={currentDate}
            onDateClick={handleDateClick}
          />
        </div>

        <TodaySchedule events={todayEvents} />
        <UpcomingEvents events={upcomingEvents} />
      </div>

      {showEventForm && (
        <EventForm
          date={selectedDate || currentDate}
          onClose={() => setShowEventForm(false)}
          onSubmit={handleEventSubmit}
        />
      )}
    </div>
  );
};

export default Calendar;