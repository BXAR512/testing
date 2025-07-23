import React, { useState } from "react";

export default function Tooltip() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const openModal = (event) => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  return (
    <div
      className="tooltip-container"
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
    >
      <img
        src="./public/question.png"
        alt="information button"
        onClick={() => openModal()}
      ></img>
      {isTooltipVisible && (
        <div className="tooltip">
          <p>Click to learn how to create calendar events!</p>
        </div>
      )}
      {isModalOpen && (
        <div className="modal-overlay-tooltip" onClick={closeModal}>
          <div className="modal-content-tooltip">
            <h3>HOW TO CREATE EVENT:</h3>
            <ol>
              <li>Select date view (Day, week, or month).</li>
              <li>Click, hold, and drag cursor to highlight times.</li>
              <li>Fill in modal information.</li>
              <li>Hit Create Event.</li>
              <li>Now Events should be avaible to view!</li>
            </ol>
            <button className="modal-close-tooltip" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
