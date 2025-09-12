"use client";
import React, { useEffect, useState } from "react";

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Fix: params should be { id: string }
  // Remove Promise type, use Next.js convention
  // Fix: Await params if it's a Promise
  const [clientId, setClientId] = useState<string>("");
  useEffect(() => {
    (async () => {
      const resolved = await params;
      setClientId(resolved.id);
    })();
  }, [params]);
  type Client = {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  type HistoryItem = {
    service: string;
    date: string;
  };
  const [client, setClient] = useState<Client | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  type EditData = {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
  };
  const [editData, setEditData] = useState<EditData>({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId);
  }, []);

  useEffect(() => {
    async function fetchClientDetails() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/clients/${clientId}`, {
          headers: { "X-User-Id": String(userId) },
        });
        if (!res.ok) throw new Error("Failed to load client details");
        const data = await res.json();
        setClient(data);
      } catch (err: any) {
        setError((err as Error).message || "Failed to load client details");
      }
      setLoading(false);
    }
    async function fetchServiceHistory() {
      try {
        const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/clients/${clientId}/history`, {
          headers: { "X-User-Id": String(userId) },
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchClientDetails();
    fetchServiceHistory();
  }, [clientId, userId]);

  // Edit contact handler
  const handleEditContact = async () => {
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/contacts/contacts/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-User-Id": String(userId) },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        setEditMode(false);
        setClient((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ...editData,
            id: prev.id // always preserve id
          };
        });
      } else {
        setEditError("Failed to update contact.");
      }
    } catch {
      setEditError("Failed to update contact.");
    }
    setEditLoading(false);
  };

  // Delete contact handler
  const handleDeleteContact = async () => {
    setDeleteLoading(true);
    setEditError("");
    try {
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/contacts/${clientId}`, {
        method: "DELETE",
        headers: { "X-User-Id": String(userId) },
      });
      if (res.ok) {
        window.location.href = "/clients";
      } else {
        let errorMsg = `Failed to delete contact. (Status: ${res.status})`;
        try {
          const data = await res.json();
          if (data?.message) errorMsg = data.message;
        } catch (e) {
          // Could not parse JSON
        }
        setEditError(errorMsg);
        console.error("Delete contact error:", errorMsg);
      }
    } catch (err) {
      setEditError("Failed to delete contact. Network or server error.");
    }
    setDeleteLoading(false);
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!client) return <div className="p-6">Client not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Client Details</h1>
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        {editMode ? (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Contact Name"
              value={editData.name ?? client.name}
              onChange={e => setEditData({ ...editData, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <input
              type="email"
              placeholder="Contact Email"
              value={editData.email ?? client.email}
              onChange={e => setEditData({ ...editData, email: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Company"
              value={editData.company ?? client.company ?? ""}
              onChange={e => setEditData({ ...editData, company: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Phone"
              value={editData.phone ?? client.phone ?? ""}
              onChange={e => setEditData({ ...editData, phone: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleEditContact}
                className="bg-green-700 text-white px-4 py-2 rounded font-semibold"
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold"
              >
                Cancel
              </button>
            </div>
            {editError && <p className="text-red-600 mt-2">{editError}</p>}
          </div>
        ) : (
          <>
            {client.company && (
              <p className="mb-2"><span className="font-semibold">Company:</span> {client.company}</p>
            )}
            <p className="mb-2"><span className="font-semibold">Contact Name:</span> {client.name}</p>
            <p className="mb-2"><span className="font-semibold">Contact Email:</span> {client.email}</p>
            {client.phone && (
              <p className="mb-2"><span className="font-semibold">Contact Phone:</span> {client.phone}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setEditMode(true); setEditData({}); }}
                className="bg-blue-600 text-white px-4 py-2 rounded font-semibold"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteContact}
                className="bg-red-600 text-white px-4 py-2 rounded font-semibold"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
            {editError && <p className="text-red-600 mt-2">{editError}</p>}
          </>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Service History</h2>
        {history.length === 0 ? (
          <p className="text-gray-500">No service history found.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((item, idx) => (
              <li key={idx} className="border-b pb-2">
                <span className="font-semibold">{item.service}</span> on {item.date}
              </li>
            ))}
          </ul>
        )}
      </div>
      <ContactPoints contactId={client.id} />
    </div>
  );
}

export type ContactPoint = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

function ContactPoints({ contactId }: { contactId: string }) {
  const [contactPoints, setContactPoints] = useState<ContactPoint[]>([]);
  const [newPoint, setNewPoint] = useState<Omit<ContactPoint, "id">>({ name: "", email: "", phone: "", role: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/contacts/${contactId}/contact_points`)
      .then(res => res.json())
      .then(data => setContactPoints(data.contact_points || []));
  }, [contactId]);

  const addContactPoint = async () => {
    setLoading(true);
    const res = await fetch(`http://127.0.0.1:5000/contacts/${contactId}/contact_points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPoint)
    });
    if (res.ok) {
      const data = await res.json();
      setContactPoints(cp => [...cp, { ...newPoint, id: data.id }]);
      setNewPoint({ name: "", email: "", phone: "", role: "" });
    }
    setLoading(false);
  };

  const removeContactPoint = async (id: string) => {
    setLoading(true);
    const res = await fetch(`http://127.0.0.1:5000/contacts/contact_points/${id}`, { method: "DELETE" });
    if (res.ok) {
      setContactPoints(cp => cp.filter(p => p.id !== id));
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Contact Points</h3>
      <ul>
        {contactPoints.map(cp => (
          <li key={cp.id}>
            <b>{cp.name}</b> ({cp.role || "No role"})<br />
            Email: {cp.email || "-"} | Phone: {cp.phone || "-"}
            <button onClick={() => removeContactPoint(cp.id)} disabled={loading} style={{ marginLeft: 8 }}>Remove</button>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 12 }}>
        <input placeholder="Name" value={newPoint.name} onChange={e => setNewPoint({ ...newPoint, name: e.target.value })} />
        <input placeholder="Email" value={newPoint.email} onChange={e => setNewPoint({ ...newPoint, email: e.target.value })} />
        <input placeholder="Phone" value={newPoint.phone} onChange={e => setNewPoint({ ...newPoint, phone: e.target.value })} />
        <input placeholder="Role" value={newPoint.role} onChange={e => setNewPoint({ ...newPoint, role: e.target.value })} />
        <button onClick={addContactPoint} disabled={loading || !newPoint.name} style={{ marginLeft: 8 }}>Add</button>
      </div>
    </div>
  );
}
