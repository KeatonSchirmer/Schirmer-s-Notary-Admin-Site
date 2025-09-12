"use client";
import React, { useState, useEffect } from "react";

type MileageEntry = {
  id: number;
  date: string;
  miles: number;
  purpose: string;
};

export default function MileagePage() {
  const [entries, setEntries] = useState<MileageEntry[]>([]);
  const [weeklyMileage, setWeeklyMileage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [error, setError] = useState("");
  const [weeklyError, setWeeklyError] = useState("");
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId);
  }, []);

  useEffect(() => {
    async function fetchMileage() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://schirmer-s-notary-backend.onrender.com/mileage/", {
          headers: { "X-User-Id": String(userId) }, // Use userId from localStorage
        });
        const data = await res.json();
        setEntries(data.entries || []);
      } catch {
        setError("Failed to load mileage entries");
      } finally {
        setLoading(false);
      }
    }
    async function fetchWeeklyMileage() {
      setWeeklyLoading(true);
      setWeeklyError("");
      try {
        const weeklyRes = await fetch("https://schirmer-s-notary-backend.onrender.com/mileage/weekly", {
          headers: { "X-User-Id": String(userId) }, // Use userId from localStorage
        });
        const data = await weeklyRes.json();
        setWeeklyMileage(data.weekly_mileage ?? 0);
      } catch {
        setWeeklyError("Failed to load weekly mileage");
      } finally {
        setWeeklyLoading(false);
      }
    }
    if (userId) {
      fetchMileage();
      fetchWeeklyMileage();
    }
  }, [userId]);

  const handlePrintPDF = () => {
    // Opens backend-generated PDF
    window.open("/mileage/pdf", "_blank");
  };

  const totalMiles = entries.reduce((sum, e) => sum + e.miles, 0);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mileage Log</h1>
        <button
          onClick={handlePrintPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
        >
          Print PDF
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white p-4 rounded-2xl shadow mb-6">
        <p className="text-gray-500 text-sm">Total Miles Tracked</p>
        <p className="text-xl font-semibold text-blue-600">{totalMiles} miles</p>
      </div>

      {/* Weekly Mileage Section */}
      <div className="bg-white p-4 rounded-2xl shadow mb-6">
        <p className="text-gray-500 text-sm">Mileage This Week</p>
        {weeklyLoading ? (
          <p className="text-gray-500">Loading weekly mileage...</p>
        ) : weeklyError ? (
          <p className="text-red-500">{weeklyError}</p>
        ) : (
          <p className="text-xl font-semibold text-green-600">{weeklyMileage} miles</p>
        )}
      </div>

      {/* Entries */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-500">No mileage entries found.</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white p-4 rounded-2xl shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{entry.date}</p>
                <p className="text-sm text-gray-500">{entry.purpose}</p>
              </div>
              <p className="text-blue-600 font-bold">{entry.miles} mi</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}