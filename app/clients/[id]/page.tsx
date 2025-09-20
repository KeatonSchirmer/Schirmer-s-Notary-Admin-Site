"use client";
import React, { useEffect, useState } from "react";

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
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
    company?: string | { name?: string };
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
    company_address?: string;
  };
  const [editData, setEditData] = useState<EditData>({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [userId, setUserId] = React.useState<string | null>(null);

  const [premiumPlan, setPremiumPlan] = useState<string>("");
  const [premiumEditMode, setPremiumEditMode] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(false);

  React.useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId);
  }, []);

  useEffect(() => {
    if (!clientId || !userId) return;

    async function fetchClientDetails() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/clients/${clientId}`, {
          headers: { "X-User-Id": String(userId) },
        });
        if (!res.ok) throw new Error("Failed to load client details");
        const data: Client = await res.json();
        setClient(data);
      } catch (err: unknown) {
        setError((err instanceof Error ? err.message : String(err)) || "Failed to load client details");
      }
      setLoading(false);
    }

    async function fetchServiceHistory() {
      try {
        const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/clients/${clientId}/history`, {
          headers: { "X-User-Id": String(userId) },
        });
        if (res.ok) {
          const data: { history: HistoryItem[] } = await res.json();
          setHistory(data.history || []);
        }
      } catch {
      }
    }

    async function fetchPremium() {
      try {
        const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/clients/${clientId}/premium`, {
          headers: { "X-User-Id": String(userId) },
        });
        if (res.ok) {
          const data = await res.json();
          setPremiumPlan(data.premium_plan || "");
        }
      } catch {}
    }
    fetchClientDetails();
    fetchServiceHistory();
    fetchPremium();
  }, [clientId, userId]);

  const handleEditContact = async () => {
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-User-Id": String(userId) },
        body: JSON.stringify({
          ...editData,
          company_name: editData.company ?? client?.company ?? "",
          company_address: editData.company_address ?? ""
        }),
      });
      if (res.ok) {
        setEditMode(false);
        setClient((prev: Client | null) => {
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

  const handleSendAccountEmail = async () => {
    await fetch(`https://schirmer-s-notary-backend.onrender.com/clients/${clientId}/send-confirmation`, {
      method: "POST",
      headers: { "X-User-Id": String(userId) },
    });
    alert("Account creation email sent!");
  };

  const handleSavePremium = async () => {
    setPremiumLoading(true);
    try {
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/clients/${clientId}/premium`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-User-Id": String(userId) },
        body: JSON.stringify({ premium_plan: premiumPlan }),
      });
      if (res.ok) setPremiumEditMode(false);
    } catch {}
    setPremiumLoading(false);
  };

  // Delete contact handler
  const handleDeleteContact = async () => {
    setDeleteLoading(true);
    setEditError("");
    try {
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/clients/${clientId}`, {
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
        } catch {
        }
        setEditError(errorMsg);
        console.error("Delete contact error:", errorMsg);
      }
    } catch {
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
              placeholder="Name"
              value={editData.name ?? client.name}
              onChange={e => setEditData({ ...editData, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <input
              type="email"
              placeholder="Email"
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
              <p className="mb-2">
                <span className="font-semibold">Company:</span>{" "}
                {typeof client.company === "string"
                  ? client.company
                  : client.company.name ?? ""}
              </p>
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
              {/* Button to send account creation email */}
              <button
                onClick={handleSendAccountEmail}
                className="bg-green-600 text-white px-4 py-2 rounded font-semibold"
              >
                Send Account Creation Email
              </button>
            </div>
            {/* Premium plan section */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Premium Plan</h3>
              {premiumEditMode ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={premiumPlan}
                    onChange={e => setPremiumPlan(e.target.value)}
                    className="p-2 border rounded"
                    placeholder="Premium Plan"
                  />
                  <button
                    onClick={handleSavePremium}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                    disabled={premiumLoading}
                  >
                    {premiumLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setPremiumEditMode(false)}
                    className="bg-gray-300 text-gray-800 px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <span>{premiumPlan || "None"}</span>
                  <button
                    onClick={() => setPremiumEditMode(true)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                </div>
              )}
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
    </div>
  );
}