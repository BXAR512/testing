import React from "react";
export default function eventListModal({ isOpen, event, onClose }) {
  if (!isOpen || !event) {
    return null;
  }

  const handleModalClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      onClose();
    }
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
