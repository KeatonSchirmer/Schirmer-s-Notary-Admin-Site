"use client";
import React, { useEffect, useState } from "react";
import { useGoogleLogin } from '@react-oauth/google';

type EventItem = {
  id: string | number;
  name: string;
  start_date: string;
  location: string;
  notes?: string;
  source?: "local" | "google";
};

type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
};

const API_BASE = "https://schirmer-s-notary-backend.onrender.com";
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type DayAvailabilities = { [day: string]: { start: string; end: string } };
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<EventItem[]>([]);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Availability states
  const [dayAvailabilities, setDayAvailabilities] = useState<DayAvailabilities>({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDays, setEditDays] = useState<string[]>([]);
  const [editTimes, setEditTimes] = useState<DayAvailabilities>({});
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  // Event modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventForm, setEventForm] = useState<{ name: string; date: string; location: string; notes: string }>({
    name: "",
    date: "",
    location: "",
    notes: "",
  });

  // Google login and sync
  useEffect(() => {
    const storedToken = localStorage.getItem("googleAccessToken");
    const storedExpiry = localStorage.getItem("googleAccessTokenExpiry");
    if (storedToken && storedExpiry && Date.now() < Number(storedExpiry)) {
      setGoogleAccessToken(storedToken);
    } else {
      localStorage.removeItem("googleAccessToken");
      localStorage.removeItem("googleAccessTokenExpiry");
    }
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleAccessToken(tokenResponse.access_token);
      localStorage.setItem("googleAccessToken", tokenResponse.access_token);
      localStorage.setItem(
        "googleAccessTokenExpiry",
        String(Date.now() + (tokenResponse.expires_in || 3600) * 1000)
      );
      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }
      );
      const data = await res.json();
      const mappedEvents = (data.items as GoogleCalendarEvent[] || []).map((e) => ({
        id: e.id,
        name: e.summary || "No Title",
        start_date: e.start.dateTime || e.start.date || "",
        location: e.location || "",
        notes: e.description || "",
        source: "google" as const,
      }));
      setGoogleEvents(mappedEvents);

      for (const ge of mappedEvents) {
        await fetch(`${API_BASE}/calendar/google-sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": String(userId),
          },
          body: JSON.stringify(ge),
        });
      }
      const res2 = await fetch(`${API_BASE}/calendar/local`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId),
        },
      });
      const data2 = await res2.json();
      setEvents((data2.events || []).map((e: EventItem) => ({ ...e, source: "local" })));
    },
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
  });

  useEffect(() => {
    if (!googleAccessToken) login();
  }, [googleAccessToken, login]);

  useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId);
  }, []);

  // Fetch availability
  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/calendar/availability`, {
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": String(userId),
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.available_days_json) {
          setDayAvailabilities(JSON.parse(data.available_days_json));
        } else {
          setDayAvailabilities({});
        }
      });
  }, [userId, editModalVisible]);

  useEffect(() => {
    if (editModalVisible) {
      setEditDays(Object.keys(dayAvailabilities));
      setEditTimes({ ...dayAvailabilities });
    }
  }, [editModalVisible, dayAvailabilities]);

  function handleToggleEditDay(day: string) {
    setEditDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
    setEditTimes(prev =>
      prev[day]
        ? prev
        : { ...prev, [day]: { start: "09:00", end: "17:00" } }
    );
  }

  async function saveAvailability(e: React.FormEvent) {
    e.preventDefault();
    setSavingAvailability(true);
    setAvailabilityError("");
    try {
      const payload = { available_days_json: JSON.stringify(editTimes) };
      const res = await fetch(`${API_BASE}/calendar/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": String(userId) },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setEditModalVisible(false);
      } else {
        setAvailabilityError(data?.message || "Failed to save availability.");
      }
    } catch {
      setAvailabilityError("Failed to save availability.");
    }
    setSavingAvailability(false);
  }

  // Fetch events
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch(`${API_BASE}/calendar/local`, {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": String(userId),
          },
        });
        if (!res.ok) throw new Error("Failed to load events");
        const data = await res.json();
        setEvents((data.events || []).map((e: EventItem) => ({ ...e, source: "local" })));
      } catch {}
    }
    if (userId) fetchEvents();
  }, [userId]);

  const mergedEvents = [...events, ...googleEvents];

  // Calendar logic
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const weeks: (number | null)[][] = [];
  let day = 1 - firstDayOfMonth;
  while (day <= daysInMonth) {
    const week: (number | null)[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day > 0 && day <= daysInMonth ? day : null);
      day++;
    }
    weeks.push(week);
  }

  const changeMonth = (offset: number) => {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDate(null);
  };

  const eventsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return mergedEvents.filter((e) => e.start_date.startsWith(dateStr));
  };

  // Add/Edit Event Modal logic
  const openAddModal = (date?: string) => {
    setEditingEvent(null);
    setEventForm({ name: "", date: date || "", location: "", notes: "" });
    setShowEventModal(true);
  };

  const openEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      date: event.start_date,
      location: event.location,
      notes: event.notes || "",
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const payload = {
      name: eventForm.name,
      date: eventForm.date,
      location: eventForm.location,
      notes: eventForm.notes,
    };
    if (editingEvent) {
      await fetch(`${API_BASE}/calendar/local/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-User-Id": String(userId) },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`${API_BASE}/calendar/local`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": String(userId) },
        body: JSON.stringify(payload),
      });
    }
    setShowEventModal(false);
    setEditingEvent(null);

    if (googleAccessToken) {
      await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: eventForm.name,
          location: eventForm.location,
          description: eventForm.notes,
          start: { dateTime: eventForm.date },
          end: {
            dateTime: new Date(new Date(eventForm.date).getTime() + 45 * 60 * 1000).toISOString()
          },
        }),
      });
    }

    const res = await fetch(`${API_BASE}/calendar/local`, {
      headers: { "Content-Type": "application/json", "X-User-Id": String(userId) },
    });
    const data = await res.json();
    setEvents((data.events || []).map((e: EventItem) => ({ ...e, source: "local" })));
  };

  const handleDeleteEvent = async (eventId: string | number) => {
    if (!userId) return;
    await fetch(`${API_BASE}/calendar/local/${eventId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "X-User-Id": String(userId) },
    });
    const res = await fetch(`${API_BASE}/calendar/local`, {
      headers: { "Content-Type": "application/json", "X-User-Id": String(userId) },
    });
    const data = await res.json();
    setEvents((data.events || []).map((e: EventItem) => ({ ...e, source: "local" })));
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-70">
      {/* Office Availability Card */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 32,
            margin: 16,
            position: "relative",
            boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
            maxWidth: 600,
            minWidth: 320,
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#222",
              marginBottom: 16,
            }}
          >
            Availability
          </div>
          {Object.keys(dayAvailabilities).length > 0 ? (
            DAY_LABELS.map((day) =>
              dayAvailabilities[day] ? (
                <div
                  key={day}
                  style={{
                    fontSize: 16,
                    color: "#222",
                    padding: "4px 0",
                    marginBottom: 8,
                    display: "flex",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{day}:</span>
                  <span>{dayAvailabilities[day].start} - {dayAvailabilities[day].end}</span>
                </div>
              ) : null
            )
          ) : (
            <div style={{ color: "#888" }}>No availability set.</div>
          )}
          <button
            style={{
              backgroundColor: "#2563eb",
              padding: 10,
              borderRadius: 50,
              position: "absolute",
              bottom: 16,
              right: 16,
              color: "#fff",
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(37,99,235,0.15)",
            }}
            onClick={() => setEditModalVisible(true)}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Edit Availability Modal */}
      {editModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            className="bg-white rounded-2xl shadow p-6 w-full max-w-md space-y-4"
            onSubmit={saveAvailability}
          >
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#222" }}>
              Edit Weekly Availability
            </div>
            <div style={{ color: "#222", marginBottom: 8 }}>
              Select days to set availability:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 12 }}>
              {DAY_LABELS.map(day => (
                <button
                  type="button"
                  key={day}
                  style={{
                    backgroundColor: editDays.includes(day) ? "#22c55e" : "#e5e7eb",
                    borderRadius: 6,
                    padding: 8,
                    margin: 4,
                    color: editDays.includes(day) ? "#fff" : "#222",
                    fontWeight: "bold",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => handleToggleEditDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
            {editDays.map(day => (
              <div key={day} style={{ marginBottom: 12 }}>
                <div style={{ color: "#222", marginBottom: 4, fontWeight: 600 }}>
                  {day} Hours:
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <select
                    value={editTimes[day]?.start || "09:00"}
                    onChange={e =>
                      setEditTimes(prev => ({
                        ...prev,
                        [day]: { ...prev[day], start: e.target.value }
                      }))
                    }
                    style={{ width: 120, marginRight: 8 }}
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span style={{ margin: "0 8px" }}>to</span>
                  <select
                    value={editTimes[day]?.end || "17:00"}
                    onChange={e =>
                      setEditTimes(prev => ({
                        ...prev,
                        [day]: { ...prev[day], end: e.target.value }
                      }))
                    }
                    style={{ width: 120 }}
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                style={{
                  backgroundColor: "#22c55e",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
                disabled={savingAvailability}
              >
                {savingAvailability ? "Saving..." : "Save Availability"}
              </button>
              <button
                type="button"
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "#222",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => setEditModalVisible(false)}
              >
                Cancel
              </button>
            </div>
            {availabilityError && <div style={{ color: "#dc2626", marginTop: 8 }}>{availabilityError}</div>}
          </form>
        </div>
      )}

      {/* Add Event Button */}
      <button onClick={() => openAddModal()} className="bg-green-600 text-white px-4 py-2 rounded mb-4 ml-2">
        + Add Event
      </button>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ←
        </button>
        <h1 className="text-3xl font-bold text-gray-800">
          {new Date(currentYear, currentMonth).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h1>
        <button
          onClick={() => changeMonth(1)}
          className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          →
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 text-center text-lg font-medium text-gray-600 mb-2">
        {DAY_LABELS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar Cells */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, wi) =>
          week.map((day, di) =>
            day ? (
              <div
                key={`${wi}-${di}`}
                onClick={() => openAddModal(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)}
                className={`rounded-xl border flex flex-col items-center justify-start p-1 cursor-pointer transition ${
                  selectedDate?.getDate() === day &&
                  selectedDate?.getMonth() === currentMonth
                    ? "bg-blue-500 text-white border-blue-600"
                    : "bg-white hover:bg-blue-50 border-gray-200"
                }`}
                style={{
                  height: "120px",
                  minHeight: "120px",
                }}
              >
                <span
                  className="font-semibold"
                  style={{
                    fontSize: "1.25rem",
                    marginBottom: 2,
                  }}
                >
                  {day}
                </span>
                <div className="mt-1 space-y-0.5 w-full">
                  {eventsForDate(day).slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className={`text-xs truncate rounded px-1 ${e.source === "google" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}
                      onClick={(ev) => { ev.stopPropagation(); openEditModal(e); }}
                    >
                      {e.name}
                      {e.source === "google" && " (Google)"}
                      <button
                        className="ml-2 text-xs text-red-600"
                        onClick={(ev) => { ev.stopPropagation(); handleDeleteEvent(e.id); }}
                      >
                        ✕
                      </button>
                      {e.notes && (
                        <div className="text-xs text-green-700 mt-1 truncate">
                          Notes: {e.notes}
                        </div>
                      )}
                    </div>
                  ))}
                  {eventsForDate(day).length > 2 && (
                    <div className="text-xs text-gray-400">+ more</div>
                  )}
                </div>
              </div>
            ) : (
              <div key={`${wi}-${di}`} style={{ height: "120px", minHeight: "120px" }}></div>
            )
          )
        )}
      </div>

      {/* Time Slots for Selected Date */}
      {selectedDate && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Time Slots for {selectedDate.toDateString()}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* You can add slot logic here if needed */}
          </div>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form
            className="bg-white p-6 rounded shadow w-full max-w-lg space-y-3"
            onSubmit={handleSaveEvent}
          >
            <h2 className="text-lg font-semibold mb-2">
              {editingEvent ? "Edit Event" : "Add Event"}
            </h2>
            <input
              type="text"
              name="name"
              placeholder="Event Name"
              value={eventForm.name}
              onChange={e => setEventForm({ ...eventForm, name: e.target.value })}
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="datetime-local"
              name="date"
              value={eventForm.date}
              onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={eventForm.location}
              onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <textarea
              name="notes"
              placeholder="Notes"
              value={eventForm.notes}
              onChange={e => setEventForm({ ...eventForm, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              style={{ resize: "vertical" }}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                onClick={() => { setShowEventModal(false); setEditingEvent(null); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}