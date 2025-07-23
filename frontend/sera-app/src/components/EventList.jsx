import React, { useState, useEffect } from "react";
import { fetchEvents, fetchMoreEvents } from "../data/data";
import EventListModal from "./EventListModal";

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadInitialEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedEvents = await fetchEvents();
        setEvents(fetchedEvents);
        setHasMoreEvents(fetchedEvents.length >= 6);
      } catch (error) {
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialEvents();
  }, []);

  const loadMoreEvents = async () => {
    setLoadingMore(true);
    try {
      const moreEvents = await fetchMoreEvents(events.length);
      if (moreEvents.length > 0) {
        setEvents((prevEvents) => {
          const exisitingIds = new Set(prevEvents.map((event) => event.id));
          const uniqueNewEvents = moreEvents.filter(
            (event) => !exisitingIds.has(event.id)
          );
          return [...prevEvents, ...uniqueNewEvents];
        });
        setHasMoreEvents(moreEvents.length >= 6);
      }
    } catch (error) {
      setError("Failed to load more events.");
    } finally {
      setLoadingMore(false);
    }
  };

  const categories = ["All", ...new Set(events.map((event) => event.category))];

  const filteredEvents = events.filter((event) => {
    const matchSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory =
      selectedCategory === "All" || event.category === selectedCategory;

    return matchCategory && matchSearch;
  });

  const openModal = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const getCapacityInfo = (event) => {
    const capacityPercentage = (event.num_attending / event.capacity) * 100;
    let size;
    if (capacityPercentage <= 10) {
      size = "low";
    } else if (capacityPercentage > 50) {
      size = "high";
    } else {
      size = "medium";
    }
    return {
      class: `${size}-capacity`,
      indicator: size,
      text: `${event.num_attending}/${event.capacity}`,
    };
  };
  return (
    <div className="event-container">
      <div className="event-header">
        <h1 className="event-title">Events</h1>
        <p className="event-subtitle">
          Discover and attend exciting school events
        </p>
      </div>
      {loading ? (
        <p>Loading events..</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          <div className="search-section">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search for events by name, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              ></input>
              <div className="search-icon">🔎</div>
            </div>

            <div className="filter-container">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-filter"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="event-board">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => {
                const capacityInfo = getCapacityInfo(event);
                return (
                  <div
                    key={event.id}
                    className={`event-card ${capacityInfo.class}`}
                  >
                    <div className="event-image-container">
                      <img
                        className="event-image"
                        src={event.image}
                        alt={event.title}
                        onError={(e) => {
                          e.target.src =
                            "https://picsum.photos/200/300?random=259";
                        }}
                      />
                      <div className="event-category">{event.category}</div>
                      <div
                        className={`capacity-indicator ${capacityInfo.indicator}`}
                      >
                        {capacityInfo.text}
                      </div>
                    </div>

                    <div className="event-content">
                      <h2 className="event-card-title">{event.title}</h2>
                      <div className="event-actions">
                        <button
                          className="detail-btn"
                          onClick={() => openModal(event)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-event">
                <p>No events found that match your search criteria!</p>
                <button
                  className="clear-search-btn"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All");
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          {hasMoreEvents && (
            <div className="load-more-section">
              <button
                className="load-more-btn"
                onClick={loadMoreEvents}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading More Events..." : "Load More Events"}
              </button>
              {loadingMore && <p>Loading more events...</p>}
            </div>
          )}
        </>
      )}
      <EventListModal
        isOpen={isModalOpen}
        event={selectedEvent}
        onClose={closeModal}
      />
    </div>
  );
}
