"use client";
import React, { useEffect, useState } from "react";

type JournalEntry = {
  id: number;
  date: string;
  client_name: string;
  document_type: string;
  id_type: string;
  id_number: string;
  signature: string;
  notes: string;
};

const API_BASE = "https://schirmer-s-notary-backend.onrender.com/"; 

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Form state
  const [form, setForm] = useState<Omit<JournalEntry, "id">>({
    date: "",
    client_name: "",
    document_type: "",
    id_type: "",
    id_number: "",
    signature: "",
    notes: "",
  });

  // Fetch journal entries
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

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add or edit entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingEntry
        ? `${API_BASE}/journal/${editingEntry.id}`
        : `${API_BASE}/journal/new`;
      const method = editingEntry ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setEditingEntry(null);
        // Refresh entries
        const entriesRes = await fetch(`${API_BASE}/journal/`);
        const entriesData = await entriesRes.json();
        setEntries(entriesData.entries || []);
      }
    } catch {
      setError("Failed to save entry.");
    }
    setLoading(false);
  };

  // Edit entry
  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setForm({
      date: entry.date,
      client_name: entry.client_name,
      document_type: entry.document_type,
      id_type: entry.id_type,
      id_number: entry.id_number,
      signature: entry.signature,
      notes: entry.notes,
    });
    setShowModal(true);
  };

  // Download PDF
  const handleDownloadPDF = (id: number) => {
    window.open(`${API_BASE}/journal/${id}/pdf`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Journal Entries</h1>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        onClick={() => {
          setEditingEntry(null);
          setForm({
            date: "",
            client_name: "",
            document_type: "",
            id_type: "",
            id_number: "",
            signature: "",
            notes: "",
          });
          setShowModal(true);
        }}
      >
        + Add Entry
      </button>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <p className="font-semibold">{entry.client_name}</p>
                <p className="text-sm text-gray-600">{entry.date}</p>
                <p className="text-sm text-gray-600">{entry.document_type}</p>
                <p className="text-sm text-gray-600">{entry.notes}</p>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded"
                  onClick={() => handleDownloadPDF(entry.id)}
                >
                  PDF
                </button>
                <button
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                  onClick={() => handleEdit(entry)}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form
            className="bg-white p-6 rounded shadow w-full max-w-lg space-y-3"
            onSubmit={handleSubmit}
          >
            <h2 className="text-lg font-semibold mb-2">
              {editingEntry ? "Edit Entry" : "Add Entry"}
            </h2>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              name="client_name"
              value={form.client_name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Client Name"
              required
            />
            <input
              type="text"
              name="document_type"
              value={form.document_type}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Document Type"
              required
            />
            <input
              type="text"
              name="id_type"
              value={form.id_type}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="ID Type"
              required
            />
            <input
              type="text"
              name="id_number"
              value={form.id_number}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="ID Number"
              required
            />
            <input
              type="text"
              name="signature"
              value={form.signature}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Signature"
              required
            />
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Notes"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                Save
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                onClick={() => setShowModal(false)}
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