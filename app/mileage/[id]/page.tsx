"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type MileageEntry = {
  id: number;
  date: string;
  distance: number;
  time?: string;
  notes?: string;
  job_id?: number;
};

const API_BASE = "https://schirmer-s-notary-backend.onrender.com/";

export default function MileageDetailPage() {
  const params = useParams();
  const mileageId = params?.id;
  const [entry, setEntry] = useState<MileageEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEntry() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/mileage/${mileageId}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setEntry(data.entry || null);
      } catch {
        setError("Failed to load mileage entry.");
      }
      setLoading(false);
    }
    if (mileageId) fetchEntry();
  }, [mileageId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error || !entry) return <div className="p-6 text-red-600">{error || "Mileage entry not found."}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mileage Entry Details</h1>
      <div className="bg-white p-6 rounded shadow space-y-3">
        <div>
          <span className="font-semibold">Date:</span> {entry.date?.slice(0, 10)}
        </div>
        <div>
          <span className="font-semibold">Distance:</span> {entry.distance} miles
        </div>
        <div>
          <span className="font-semibold">Time:</span> {entry.time || "N/A"}
        </div>
        <div>
          <span className="font-semibold">Job ID:</span> {entry.job_id ?? "N/A"}
        </div>
        <div>
          <span className="font-semibold">Notes:</span>
          <div className="mt-1">{entry.notes || "No notes available."}</div>
        </div>
      </div>
    </div>
  );
}