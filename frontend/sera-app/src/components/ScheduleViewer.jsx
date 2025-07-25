import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/ScheduleViewer.css';

const ScheduleViewer = ({ targetUserId, isOpen, onClose }) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && targetUserId) {
      fetchSchedule();
    }
  }, [isOpen, targetUserId]);

  const fetchSchedule = async () => {
    if (!targetUserId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3000/privacy/user/${targetUserId}/schedule`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch schedule');
      }
    } catch (err) {
      setError('Network error while fetching schedule');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="schedule-viewer-overlay" onClick={onClose}>
      <div className="schedule-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-viewer-header">
          <h2>User Schedule</h2>
          <button className="schedule-viewer-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="schedule-viewer-content">
          {loading && (
            <div className="schedule-loading">
              <p>Loading schedule...</p>
            </div>
          )}

          {error && (
            <div className="schedule-error">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="schedule-events">
              {schedule.length === 0 ? (
                <p className="no-events">
                  No events found in schedule. This user may be anonymous or have no events.
                </p>
              ) : (
                <div className="events-list">
                  {schedule.map((event) => (
                    <div key={event.id} className="event-item">
                      <div className="event-header">
                        <h3 className="event-title">{event.eventTitle}</h3>
                        <span className={`event-visibility ${event.isPublic ? 'public' : 'private'}`}>
                          {event.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                      
                      <div className="event-details">
                        <p className="event-description">{event.eventDescription}</p>
                        <div className="event-meta">
                          <span className="event-category">{event.eventCategory}</span>
                          {event.location && (
                            <span className="event-location">📍 {event.location}</span>
                          )}
                        </div>
                      </div>

                      <div className="event-time">
                        <div className="time-range">
                          <span className="start-time">
                            {formatDate(event.startDate)} at {formatTime(event.startDate)}
                          </span>
                          <span className="time-separator">to</span>
                          <span className="end-time">
                            {formatDate(event.endDate)} at {formatTime(event.endDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleViewer; 