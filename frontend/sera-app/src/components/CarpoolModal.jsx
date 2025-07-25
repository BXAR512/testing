import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/CarpoolModal.css';

const CarpoolModal = ({ event, isOpen, onClose }) => {
  const [carpoolParticipants, setCarpoolParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && event) {
      fetchCarpoolParticipants();
    }
  }, [isOpen, event]);

  const fetchCarpoolParticipants = async () => {
    if (!event) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3000/privacy/event/${event.id}/carpool`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCarpoolParticipants(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch carpool participants');
      }
    } catch (err) {
      setError('Network error while fetching carpool participants');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="carpool-modal-overlay" onClick={onClose}>
      <div className="carpool-modal" onClick={(e) => e.stopPropagation()}>
        <div className="carpool-modal-header">
          <h2>Carpool Participants</h2>
          <button className="carpool-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="carpool-modal-content">
          {loading && (
            <div className="carpool-loading">
              <p>Loading carpool participants...</p>
            </div>
          )}

          {error && (
            <div className="carpool-error">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="carpool-participants">
              {carpoolParticipants.length === 0 ? (
                <p className="no-participants">
                  No carpool participants available. Anonymous users are not included in carpooling.
                </p>
              ) : (
                <div className="participants-list">
                  {carpoolParticipants.map((participant) => (
                    <div key={participant.id} className="participant-item">
                      <div className="participant-info">
                        <span className="participant-name">{participant.username}</span>
                        <span className="participant-role">{participant.role}</span>
                      </div>
                      {participant.coordinatesId && (
                        <div className="participant-location">
                          <span>📍 Has location data</span>
                        </div>
                      )}
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

export default CarpoolModal; 