"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type Signer = {
  name: string;
  address?: string;
  phone?: string;
};

type JournalEntry = {
  id: number;
  date: string;
  location: string;
  signers: Signer[];
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
        setEntries(
          (Array.isArray(data.entries) ? data.entries : data).map((e: any) => ({
            id: e.id ?? 0,
            date: e.date ?? "",
            location: e.location ?? "",
            signers: Array.isArray(e.signers) ? e.signers : [],
            document_type: e.document_type ?? "",
            id_verification: !!e.id_verification,
            notes: e.notes ?? "",
          }))
        );
      } catch {
        setError("Failed to load journal entries.");
        setEntries([]);
      }
      setLoading(false);
    }
    fetchEntries();
  }, []);

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
                <div>
                  {entry.signers && entry.signers.length > 0 ? (
                    entry.signers.map((s, idx) => (
                      <span key={idx} className="text-sm text-gray-600">
                        {s.name}
                        {idx < entry.signers.length - 1 ? ", " : ""}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-600">No signer</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Document: {entry.document_type}</p>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <Link
                  href={`/journal/${entry.id}`}
                  className="bg-blue-600 text-white px-3 py-1 rounded flex items-center justify-center"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}