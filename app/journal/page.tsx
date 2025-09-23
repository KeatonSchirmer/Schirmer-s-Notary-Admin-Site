"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type JournalEntry = {
  id: number;
  date: string;
  location: string;
  signer_name: string;
  signer_address: string;
  signer_phone: string;
  document_type: string;
  id_verification: boolean;
  notes: string;
};

const API_BASE = "https://schirmer-s-notary-backend.onrender.com";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/journal/`);
        const data = await res.json();
        setEntries(data.entries || []);
      } catch {
        setError("Failed to load journal entries.");
      }
      setLoading(false);
    }
    fetchEntries();
  }, []);

  const handleDownloadPDF = (id: number) => {
    window.open(`${API_BASE}/journal/${id}/pdf`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Journal Entries</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:items-center justify-between"
            >
              <div>
                <Link
                  href={`/journal/${entry.id}`}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {entry.signer_name}
                </Link>
                <p className="text-sm text-gray-600">{entry.date}</p>
                <p className="text-sm text-gray-600">{entry.document_type}</p>
                <p className="text-sm text-gray-600">{entry.location}</p>
                <p className="text-sm text-gray-600">{entry.notes}</p>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded"
                  onClick={() => handleDownloadPDF(entry.id)}
                >
                  PDF
                </button>
                <Link
                  href={`/journal/${entry.id}`}
                  className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center justify-center"
                >
                  View / Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}