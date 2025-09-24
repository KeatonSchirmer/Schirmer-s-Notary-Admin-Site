"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  document_type: string;
  id_verification: boolean;
  notes: string;
  signers?: Signer[];
};

const API_BASE = "https://schirmer-s-notary-backend.onrender.com/";

export default function JournalEntryPage() {
  const params = useParams();
  const id = params?.id;
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editEntry, setEditEntry] = useState<Partial<JournalEntry>>({});

  useEffect(() => {
    async function fetchEntry() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/journal/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setEntry(data.entry ?? data);
        setEditEntry(data.entry ?? data);
      } catch {
        setError("Failed to load journal entry.");
        setEntry(null);
      }
      setLoading(false);
    }
    if (id) fetchEntry();
  }, [id]);

  const handleDownloadPDF = () => {
    if (entry) {
      window.open(`${API_BASE}/journal/${entry.id}/pdf`, "_blank");
    }
  };

  async function saveEdit() {
    if (!entry) return;
    try {
      const res = await fetch(`${API_BASE}/journal/${entry.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editEntry),
      });
      if (res.ok) {
        alert("Entry updated");
        setEntry({ ...entry, ...editEntry });
        setEditMode(false);
      } else {
        alert("Failed to update entry");
      }
    } catch {
      alert("Failed to update entry");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Journal Entry</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : entry ? (
        <div className="bg-white p-4 rounded shadow">
          {editMode ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                saveEdit();
              }}
            >
              <input
                type="text"
                value={editEntry.date ?? entry.date}
                onChange={ev => setEditEntry(e => ({ ...e, date: ev.target.value }))}
                placeholder="Date"
                className="mb-2 p-2 border rounded w-full"
              />
              <input
                type="text"
                value={editEntry.location ?? entry.location}
                onChange={ev => setEditEntry(e => ({ ...e, location: ev.target.value }))}
                placeholder="Location"
                className="mb-2 p-2 border rounded w-full"
              />
              <input
                type="text"
                value={editEntry.document_type ?? entry.document_type}
                onChange={ev => setEditEntry(e => ({ ...e, document_type: ev.target.value }))}
                placeholder="Document Type"
                className="mb-2 p-2 border rounded w-full"
              />
              <textarea
                value={editEntry.notes ?? entry.notes}
                onChange={ev => setEditEntry(e => ({ ...e, notes: ev.target.value }))}
                placeholder="Notes"
                className="mb-2 p-2 border rounded w-full"
              />
              <div className="flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">
                  Save
                </button>
                <button
                  type="button"
                  className="bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div>
                <p className="font-semibold text-blue-700 mb-2">
                  {entry.signers && entry.signers.length > 0
                    ? entry.signers.map((s, i) => (
                        <span key={i}>
                          {s.name}
                          {i < entry.signers!.length - 1 ? ", " : ""}
                        </span>
                      ))
                    : "No signers"}
                </p>
                <p className="text-sm text-gray-600">{entry.date}</p>
                <p className="text-sm text-gray-600">{entry.document_type}</p>
                <p className="text-sm text-gray-600">{entry.location}</p>
                <p className="text-sm text-gray-600">{entry.notes}</p>
                {entry.signers && entry.signers.length > 0 && (
                  <div className="mt-2">
                    {entry.signers.map((s, i) => (
                      <div key={i} className="mb-1">
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">Signer {i + 1}:</span>
                          {s.name && <> Name: {s.name}</>}
                          {s.address && <> | Address: {s.address}</>}
                          {s.phone && <> | Phone: {s.phone}</>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  ID Verified: {entry.id_verification ? "Yes" : "No"}
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </button>
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded"
                  onClick={handleDownloadPDF}
                >
                  PDF
                </button>
                <Link
                  href="/journal"
                  className="bg-gray-400 text-white px-3 py-1 rounded flex items-center justify-center"
                >
                  Back to Journal
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-gray-500">No entry found.</p>
      )}
    </div>
  );
}