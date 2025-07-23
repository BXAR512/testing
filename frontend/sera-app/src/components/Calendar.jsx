import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import Tooltip from "./Tooltip";
import "../css/Calendar.css";

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    start: new Date(),
    end: new Date(),
    allDay: false,
  });

    const safeCreateDate = (dateValue) => {
    try{
        const date = new Date(dateValue);
        return !isNaN(date.getTime()) ? date : new Date();
    } catch (error) {
        return new Date();
    }
  };

  const convertUTC = (localDate) => {
        if(localDate instanceof Date && !isNaN(localDate.getTime())){
            const utcDate = new Date(localDate.getTime() + (localDate.getTimezoneOffset()) * 60000);
            return utcDate;
        }
        return localDate;
  };

  useEffect(() => {
    const savedEvents = localStorage.getItem("calendarEvents");
    if (savedEvents) {
      setEvents(
        JSON.parse(savedEvents).map((event) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }))
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }, [events]);

  const handleDateSelect = (selectInfo) => {
    setEventForm({
      title: "",
      description: "",
      start: convertUTC(safeCreateDate(selectInfo.start)),
      end: convertUTC(safeCreateDate(selectInfo.end)),
      allDay: false,
    });
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setEventForm({
      title: clickInfo.title,
      description: clickInfo.description || "",
      start: convertUTC(safeCreateDate(clickInfo.start)),
      end: convertUTC(safeCreateDate(clickInfo.end)),
      allDay: clickInfo.allDay,
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = () => {
    if (!eventForm.title.trim()) {
      alert("Please enter an event title");
      return;
    }

    const newEvent = {
      id: selectedEvent ? selectedEvent.id : Date.now().toString(),
      title: eventForm.title,
      description: eventForm.description,
      start: convertUTC(safeCreateDate(eventForm.start)),
      end: convertUTC(safeCreateDate(eventForm.end)),
      allDay: eventForm.allDay,
    };

    if (selectedEvent) {
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id ? newEvent : event
        )
      );
    } else {
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    }

    setSelectedEvent(null);
    setShowEventModal(false);
    setEventForm({
      title: "",
      description: "",
      start: new Date(),
      end: new Date(),
      allDay: false,
    });
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== selectedEvent.id)
      );
      setSelectedEvent(null);
      setShowEventModal(false);
      setEventForm({
        title: "",
        description: "",
        start: new Date(),
        end: new Date(),
        allDay: false,
      });
    }
  };
  const handleCancel = () => {
    setSelectedEvent(null);
    setShowEventModal(false);
    setEventForm({
      title: "",
      description: "",
      start: new Date(),
      end: new Date(),
      allDay: false,
    });
  };


  const clearAllEvents = () => {
    if (window.confirm("Are you sure you want to clear all events?")) {
      setEvents([]);
    }
  };
  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1> Event Scheduler</h1>
        <p>
          Click on a time slot to add an event, or click on an exisiting event
          to edit
        </p>

        <div className="calendar-actions">
          <button className="btn-danger" onClick={clearAllEvents}>
            Clear All Events
          </button>
          <Tooltip/>
        </div>
      </div>

      <div className="calendar-wrapper">
        <FullCalendar
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            listPlugin,
          ]}
          headerToolbar={{
            left: "prev, next, today",
            center: "title",
            right: "dayGridMonth, timeGridWeek, timeGridDay, listWeek",
          }}
          initialView="dayGridMonth"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={(arg) => (
            <div className="event-content">
              <div className="event-title">{arg.event.title}</div>
              {arg.event.extendedProps.description && (
                <div className="event-description">
                  {arg.event.extendedProps.description}
                </div>
              )}
            </div>
          )}
        />
      </div>

      {showEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{selectedEvent ? "Edit Event" : "Add New Event"}</h2>

            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={eventForm.title || ""}
                onChange={(e) =>
                  setEventForm({ ...eventForm, title: e.target.value })
                }
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={eventForm.description}
                onChange={(e) =>
                  setEventForm({ ...eventForm, description: e.target.value })
                }
                placeholder="Enter event description"
                rows="3"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={eventForm.start.toISOString().slice(0, 16)}
                  onChange={(e) =>{
                    const newDate = safeCreateDate(e.target.value)
                    setEventForm({
                      ...eventForm,
                      start: newDate,
                    })
                  }            
                  }
 
                />
              </div>
              <div className="form-group">
                <label>End Date & Time</label>
                <input
                  type="datetime-local"
                  value={eventForm.end.toISOString().slice(0, 16)}
                  onChange={(e) =>{
                    const newDate = safeCreateDate(e.target.value)
                    setEventForm({
                      ...eventForm,
                      end: newDate,
                    })  
                  }
  
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={eventForm.allDay}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, allDay: e.target.checked })
                  }
                />
                All Day Event
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSaveEvent}>
                {selectedEvent ? "Update Event" : "Add Event"}
              </button>
              {selectedEvent && (
                <button className="btn-danger" onClick={handleDeleteEvent}>
                  Delete
                </button>
              )}
              <button className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
