"use client";
import { request } from "https";
import React, { useEffect, useState } from "react";

// Example event type
type EventItem = {
  id: number;
  name: string;
  start_date: string; // ISO string e.g. "2025-09-06"
  location: string;
};

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId);
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:5000/calendar/local", {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": String(userId),
          },
        });
        if (!res.ok) throw new Error("Failed to load events");
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err: any) {
        setError(err.message || "Failed to load events");
      }
      setLoading(false);
    }
    if (userId) fetchEvents();
  }, [userId]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
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
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.start_date.startsWith(dateStr));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
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

      {/* Calendar Grid */}
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
                onClick={() =>
                  setSelectedDate(new Date(currentYear, currentMonth, day))
                }
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
                      className="text-xs truncate bg-blue-100 text-blue-700 rounded px-1"
                    >
                      {e.name}
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

      {/* Event list */}
      {selectedDate && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Events on {selectedDate.toDateString()}
          </h2>
          {eventsForDate(selectedDate.getDate()).length === 0 ? (
            <p className="text-gray-500 italic">No events scheduled.</p>
          ) : (
            <div className="space-y-3">
              {eventsForDate(selectedDate.getDate()).map((event) => (
                <div
                  key={event.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
                >
                  <p className="text-base font-medium text-gray-800">
                    {event.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {
            (() => {
              try {
                const dateStr = event.start_date.length === 10
                  ? event.start_date + 'T00:00:00'
                  : event.start_date;
                const dateObj = new Date(dateStr);
                return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } catch {
                return event.start_date;
              }
            })()
          } @ {event.location}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}