"use client";
import React, { useEffect, useState } from "react";

interface Appointment {
  id: number;
  name: string;
  start_date: string;
  location: string;
}

interface RequestItem {
  id: number;
  name: string;
  status: string;
}

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [mileage, setMileage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mileageError, setMileageError] = useState("");
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId);
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!userId) return;
      setLoading(true);
      setError("");
      try {
        const appointmentsRes = await fetch("https://schirmer-s-notary-backend.onrender.com/calendar/local", {
          headers: { "X-User-Id": String(userId) },
        });
        if (!appointmentsRes.ok) throw new Error("Failed to load appointments");
        const appointmentsData = await appointmentsRes.json();

        const requestsRes = await fetch("https://schirmer-s-notary-backend.onrender.com/jobs/", {
          headers: { "X-User-Id": String(userId) },
        });
        if (!requestsRes.ok) throw new Error("Failed to load requests");
        const requestsData = await requestsRes.json();

        setAppointments(appointmentsData.events || []);
        setRequests(requestsData.requests || requestsData || []);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [userId]);

  useEffect(() => {
    async function fetchMileage() {
      if (!userId) return;
      try {
        const mileageRes = await fetch("https://schirmer-s-notary-backend.onrender.com/mileage/weekly", {
          headers: { "X-User-Id": String(userId) },
        });
        if (!mileageRes.ok) throw new Error("Failed to load weekly mileage");
        const mileageData = await mileageRes.json();
        if (typeof mileageData.weekly_mileage === "number") {
          setMileage(mileageData.weekly_mileage);
          setMileageError("");
        } else {
          setMileage(0);
          setMileageError("");
        }
      } catch (err: any) {
        setMileage(0);
        setMileageError(err.message || "Failed to load weekly mileage");
      }
    }
    fetchMileage();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Appointments Section */}
          <section className="bg-white rounded-2xl shadow p-5 flex flex-col">
            <h2 className="text-lg font-semibold mb-3">Appointments</h2>
            {appointments.length === 0 ? (
              <p className="text-gray-500">No appointments scheduled.</p>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-56 pr-1">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <p className="font-medium text-gray-800">{appt.name}</p>
                    <p className="text-sm text-gray-500">
                      {appt.start_date} @ {appt.location}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Requests Section */}
          <section className="bg-white rounded-2xl shadow p-5 flex flex-col">
            <h2 className="text-lg font-semibold mb-3">Requests</h2>
            {requests.length === 0 ? (
              <p className="text-gray-500">No requests available.</p>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-56 pr-1">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{req.name}</p>
                      <p className="text-xs text-gray-500">Request #{req.id}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        req.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : req.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Mileage Section */}
          <section className="bg-white rounded-2xl shadow p-5 flex flex-col">
            <h2 className="text-lg font-semibold mb-3">Weekly Mileage</h2>
            <div className="flex-grow flex items-center justify-center">
              {mileageError ? (
                <p className="text-red-500">{mileageError}</p>
              ) : mileage === 0 ? (
                <p className="text-gray-500">No weekly mileage data.</p>
              ) : (
                <p className="text-3xl font-bold text-blue-600">{mileage} mi</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}