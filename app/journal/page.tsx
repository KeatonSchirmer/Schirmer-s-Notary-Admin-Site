"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type PDF = {
  id: number;
  filename: string;
  url: string;
};

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
  pdfs?: PDF[];
};

const API_BASE = "https://schirmer-s-notary-backend.onrender.com";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<Partial<JournalEntry>>({});

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
            pdfs: Array.isArray(e.pdfs) ? e.pdfs : [],
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

  async function handleUploadDocument(entryId: number, file: File | null) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/journal/${entryId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        alert("Document uploaded");
        // Optionally, refresh entries to show new PDFs
        window.location.reload();
      } else {
        alert("Failed to upload document");
      }
    } catch {
      alert("Failed to upload document");
    }
  }

  async function saveEdit(id: number) {
    try {
      const res = await fetch(`${API_BASE}/journal/${id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editEntry),
      });
      if (res.ok) {
        alert("Entry updated");
        setEditId(null);
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, ...editEntry } : e))
        );
      } else {
        alert("Failed to update entry");
      }
    } catch {
      alert("Failed to update entry");
    }
  }

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
          {entries.map((entry) => {
            return (
              <div
                key={entry.id}
                className="bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:items-center justify-between"
              >
                <div className="flex-1">
                  {editId === entry.id ? (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        saveEdit(entry.id);
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
                          onClick={() => setEditId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        {entry.signers && entry.signers.length > 0 ? (
                          entry.signers.map((s, idx) => (
                            <div key={idx} className="text-sm text-gray-600">
                              {s.name}
                              {s.address && ` | ${s.address}`}
                              {s.phone && ` | ${s.phone}`}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-600">No signer</div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Date: {entry.date}</p>
                      <p className="text-sm text-gray-600">Document: {entry.document_type}</p>
                      <p className="text-sm text-gray-600">Location: {entry.location}</p>
                      <p className="text-sm text-gray-600">Notes: {entry.notes}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          className="bg-yellow-500 text-white px-3 py-1 rounded"
                          onClick={() => {
                            setEditId(entry.id);
                            setEditEntry(entry);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded"
                          onClick={() => handleDownloadPDF(entry.id)}
                        >
                          PDF
                        </button>
                        <Link
                          href={`/journal/${entry.id}`}
                          className="bg-blue-600 text-white px-3 py-1 rounded flex items-center justify-center"
                        >
                          View / Edit
                        </Link>
                      </div>
                    </>
                  )}
                  {entry.pdfs && entry.pdfs.length > 0 && (
                    <div className="mt-2">
                      <div className="font-semibold mb-1">Documents:</div>
                      {entry.pdfs.map(pdf => (
                        <a
                          key={pdf.id}
                          href={pdf.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-blue-100 text-blue-800 px-2 py-1 rounded mb-1"
                        >
                          {pdf.filename}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="mt-2">
                    <label className="block mb-1 font-semibold">Upload Document:</label>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={e => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleUploadDocument(entry.id, e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}