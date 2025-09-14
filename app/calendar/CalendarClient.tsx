"use client";
import React, { useEffect, useState } from "react";
import { useGoogleLogin } from '@react-oauth/google';

type EventItem = {
  id: string | number;
  name: string;
  start_date: string;
  location: string;
  source?: "local" | "google";
};

type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  location?: string;
};

const API_BASE = "https://schirmer-s-notary-backend.onrender.com";

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [officeStart, setOfficeStart] = useState(9);
  const [officeEnd, setOfficeEnd] = useState(21);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventForm, setEventForm] = useState<{ name: string; date: string; location: string }>({ name: "", date: "", location: "" });
  const [googleEvents, setGoogleEvents] = useState<EventItem[]>([]);
  const [availableDays, setAvailableDays] = useState<number[]>([0,1,2,3,4,5,6]);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Persist token in localStorage and auto-login if needed
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

  // Auto-trigger login if no valid token
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
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        }
      );
      const data = await res.json();
      const mappedEvents = (data.items as GoogleCalendarEvent[] || []).map((e) => ({
        id: e.id,
        name: e.summary || "No Title",
        start_date: e.start.dateTime || e.start.date || "",
        location: e.location || "",
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
    if (!googleAccessToken) {
      login();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleAccessToken]);

  React.useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId);
  }, []);

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
      } catch {
      }
    }
    if (userId) fetchEvents();
  }, [userId]);

  const mergedEvents = [...events, ...googleEvents];

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

  const openAddModal = (date?: string) => {
    setEditingEvent(null);
    setEventForm({ name: "", date: date || "", location: "" });
    setShowEventModal(true);
  };

  const openEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setEventForm({ name: event.name, date: event.start_date, location: event.location });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    let newEventId: string | number | undefined;
    if (editingEvent) {
      await fetch(`${API_BASE}/calendar/local/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-User-Id": String(userId) },
        body: JSON.stringify(eventForm),
      });
      newEventId = editingEvent.id;
    } else {
      const res = await fetch(`${API_BASE}/calendar/local`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": String(userId) },
        body: JSON.stringify(eventForm),
      });
      const data = await res.json();
      newEventId = data.id;
    }
    setShowEventModal(false);
    setEditingEvent(null);

    const saveAvailability = async () => {
    if (!userId) return;
    await fetch(`${API_BASE}/calendar/availability`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        "X-User-Id": String(userId),
        },
        body: JSON.stringify({
        officeStart,
        officeEnd,
        availableDays,
        }),
    });
    };

    useEffect(() => {
    if (userId) {
        saveAvailability();
    }
    }, [officeStart, officeEnd, availableDays, userId]);

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

  function getSlotsForDate(date: string) {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    if (!availableDays.includes(dayOfWeek)) return [];
    const slots: { time: string; blocked: boolean; event?: EventItem }[] = [];
    for (let hour = officeStart; hour < officeEnd; hour++) {
      for (let min = 0; min < 60; min += 45) {
        const slotTime = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        const slotDateTime = `${date}T${slotTime}`;
        const event = mergedEvents.find(e => {
          const eventDate = e.start_date.slice(0, 10);
          const eventTime = e.start_date.slice(11, 16);
          return eventDate === date && eventTime === slotTime;
        });
        slots.push({
          time: slotTime,
          blocked: !!event,
          event,
        });
      }
    }
    return slots;
  }

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button onClick={() => openAddModal()} className="bg-green-600 text-white px-4 py-2 rounded mb-4 ml-2">
        + Add Event
      </button>

      <div className="bg-white rounded-xl shadow p-4 mb-6 max-w-xl mx-auto border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Office Availability</h2>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-center">
            <label className="font-medium text-gray-600">
              Start Hour:
              <input
                type="number"
                min={0}
                max={23}
                value={officeStart}
                onChange={e => setOfficeStart(Number(e.target.value))}
                className="ml-2 w-16 border rounded px-2 py-1"
              />
            </label>
            <label className="font-medium text-gray-600">
              End Hour:
              <input
                type="number"
                min={officeStart + 1}
                max={24}
                value={officeEnd}
                onChange={e => setOfficeEnd(Number(e.target.value))}
                className="ml-2 w-16 border rounded px-2 py-1"
              />
            </label>
          </div>
          <div>
            <span className="font-medium text-gray-600 mr-2">Available Days:</span>
            <div className="flex gap-2 mt-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <button
                  key={i}
                  type="button"
                  className={`px-3 py-2 rounded-full border transition ${
                    availableDays.includes(i)
                      ? "bg-blue-500 text-white border-blue-600"
                      : "bg-gray-100 text-gray-600 border-gray-300"
                  }`}
                  onClick={() =>
                    setAvailableDays(availableDays.includes(i)
                      ? availableDays.filter(day => day !== i)
                      : [...availableDays, i])
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800">
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

      <div className="grid grid-cols-7 text-center font-medium text-gray-600 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, wi) =>
          week.map((day, di) =>
            day ? (
              <div
                key={`${wi}-${di}`}
                onClick={() => openAddModal(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)}
                className={`h-20 rounded-xl border flex flex-col items-center justify-start p-1 cursor-pointer transition ${
                  selectedDate?.getDate() === day &&
                  selectedDate?.getMonth() === currentMonth
                    ? "bg-blue-500 text-white border-blue-600"
                    : "bg-white hover:bg-blue-50 border-gray-200"
                }`}
              >
                <span className="text-sm font-semibold">{day}</span>
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
                    </div>
                  ))}
                  {eventsForDate(day).length > 2 && (
                    <div className="text-xs text-gray-400">+ more</div>
                  )}
                </div>
              </div>
            ) : (
              <div key={`${wi}-${di}`} className="h-20"></div>
            )
          )
        )}
      </div>

      {selectedDate && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Time Slots for {selectedDate.toDateString()}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {getSlotsForDate(selectedDate.toISOString().slice(0, 10)).map((slot, idx) => (
              <div
                key={idx}
                className={`p-2 rounded border flex flex-col items-center ${
                  slot.blocked
                    ? "bg-red-100 border-red-400 text-red-700"
                    : "bg-green-100 border-green-400 text-green-700"
                }`}
              >
                <span className="font-semibold">{slot.time}</span>
                {slot.blocked && (
                  <span className="text-xs mt-1">
                    Blocked by: {slot.event?.name} {slot.event?.source === "google" ? "(Google)" : ""}
                  </span>
                )}
                {!slot.blocked && <span className="text-xs mt-1">Available</span>}
              </div>
            ))}
          </div>
        </div>
      )}

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