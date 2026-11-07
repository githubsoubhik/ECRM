'use client';

import React, { useState, useRef } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import './EventForm.css';

interface CalendarEvent {
  title: string;
  time: string;
  date: string;
  endTime?: string;
  location?: string;
  description?: string;
  color: string;
  type?: string;
}

interface EventFormProps {
  date: Date;
  onClose: () => void;
  onSubmit: (event: CalendarEvent) => void;
}

const colors = [
  { name: 'Blue', hex: '#4F46E5' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Orange', hex: '#EA580C' }
];

const EventForm: React.FC<EventFormProps> = ({ date, onClose, onSubmit }) => {
  const defaultDateStr = date.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    date: defaultDateStr,
    time: '09:00',
    endTime: '10:00',
    location: '',
    description: '',
    color: '#4F46E5',
    type: 'meeting'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const startTimeInputRef = useRef<HTMLInputElement | null>(null);
  const endTimeInputRef = useRef<HTMLInputElement | null>(null);

  // Formats "YYYY-MM-DD" into "Thu, Sep 3, 2026"
  const getFormattedDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({
      ...prev,
      color
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.time.trim()) {
      newErrors.time = 'Start time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const eventData: CalendarEvent = {
      title: formData.title,
      time: formData.time,
      date: formData.date,
      endTime: formData.endTime,
      location: formData.location,
      description: formData.description,
      color: formData.color,
      type: formData.type
    };

    onSubmit(eventData);
  };

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          ref.current.showPicker();
        } catch {
          ref.current.focus();
        }
      } else {
        ref.current.focus();
      }
    }
  };

  return (
    <div className="event-form-overlay" onClick={onClose}>
      <div className="event-form-modal" onClick={e => e.stopPropagation()}>
        <div className="form-header">
          <h2>Add Event</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <label htmlFor="title">Event Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter event title"
              className={`form-input ${errors.title ? 'error' : ''}`}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-row">
            {/* Custom Interactive Date Input Field */}
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <div className="custom-picker-box" onClick={() => openPicker(dateInputRef)}>
                <span className="formatted-date-text">
                  {getFormattedDateDisplay(formData.date)}
                </span>
                <CalendarIcon className="field-icon" size={16} />
                <input
                  ref={dateInputRef}
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="hidden-picker-input"
                />
              </div>
            </div>

            {/* Interactive Start Time Input Field */}
            <div className="form-group">
              <label htmlFor="time">Start Time *</label>
              <div className="custom-picker-box" onClick={() => openPicker(startTimeInputRef)}>
                <input
                  ref={startTimeInputRef}
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`time-native-input ${errors.time ? 'error' : ''}`}
                />
                <Clock className="field-icon" size={16} />
              </div>
              {errors.time && <span className="error-message">{errors.time}</span>}
            </div>

            {/* Interactive End Time Input Field */}
            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <div className="custom-picker-box" onClick={() => openPicker(endTimeInputRef)}>
                <input
                  ref={endTimeInputRef}
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="time-native-input"
                />
                <Clock className="field-icon" size={16} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location or meeting link"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Event Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-input"
            >
              <option value="meeting">Meeting</option>
              <option value="call">Call</option>
              <option value="deadline">Deadline</option>
              <option value="task">Task</option>
              <option value="break">Break</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add notes or description"
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Event Color</label>
            <div className="color-picker">
              {colors.map(color => (
                <button
                  key={color.hex}
                  type="button"
                  className={`color-option ${formData.color === color.hex ? 'selected' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleColorSelect(color.hex)}
                  title={color.name}
                  aria-label={`Select ${color.name}`}
                />
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;