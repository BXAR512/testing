import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function eventListModal({ isOpen, event, onClose }) {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [attendeesError, setAttendeesError] = useState(null);
  const [showAttendees, setShowAttendees] = useState(false);

  useEffect(() => {
    if (isOpen && event && showAttendees) {
      fetchAttendees();
    }
  }, [isOpen, event, showAttendees]);

  const fetchAttendees = async () => {
    if (!event || !user) return;
    
    setLoadingAttendees(true);
    setAttendeesError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/privacy/event/${event.id}/attendees`, {
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAttendees(data.attendees);
      } else {
        setAttendeesError(data.message || "Failed to load attendees");
      }
    } catch (error) {
      setAttendeesError("Error loading attendees");
      console.error("Error fetching attendees:", error);
    } finally {
      setLoadingAttendees(false);
    }
  };

  if (!isOpen || !event) {
    return null;
  }

  const handleModalClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      onClose();
    }
  };

  const toggleAttendees = () => {
    setShowAttendees(!showAttendees);
  };

  return (
    <div className="modal-overlay" onClick={handleModalClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          X
        </button>

        <div className="modal-image-container">
          <img
            className="modal-image"
            src={event.image}
            alt={event.title}
            onError={(e) => {
              e.target.src = "https://picsum.photos/200/300?random=259";
            }}
          />

          <div className="modal-category">{event.category}</div>
        </div>
        <div className="modal-body">
          <h2 className="modal-title">{event.title}</h2>
          <p className="modal-description">{event.description}</p>

          <div className="modal-details">
            <h3>📅 Date: {event.date}</h3>
            <h3>📍 Location: {event.location}</h3>
            <h3>⏰ Time: {event.time}</h3>
            <h3>
              🧑‍🤝‍🧑 Capacity: {event.num_attending}/{event.capacity}
            </h3>
          </div>

          {/* Attendees Section */}
          <div className="attendees-section">
            <button 
              className="attendees-toggle-btn"
              onClick={toggleAttendees}
            >
              {showAttendees ? "Hide" : "View"} Attendees ({event.num_attending})
            </button>
            
            {showAttendees && (
              <div className="attendees-content">
                {loadingAttendees ? (
                  <p>Loading attendees...</p>
                ) : attendeesError ? (
                  <p className="attendees-error">{attendeesError}</p>
                ) : attendees.length > 0 ? (
                  <div className="attendees-list">
                    <h4>Event Attendees:</h4>
                    {attendees.map((attendance) => (
                      <div key={attendance.id} className="attendee-item">
                        <span className="attendee-name">
                          {attendance.user.isAnon 
                            ? `Anonymous (${attendance.user.username})`
                            : attendance.user.username
                          }
                        </span>
                        <span className="attendee-role">{attendance.user.role}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No attendees found.</p>
                )}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button className="register-btn">Register for event</button>
            <button className="modal-cancel-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
