"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  useEffect(() => {
    (async () => {
      const resolved = await params;
      setId(resolved.id);
    })();
  }, [params]);

  type RequestDetails = {
    id: string;
    client_id?: number;
    name?: string;
    email?: string;
    phone?: string;
    service: string;
    urgency: string;
    notes: string;
    service_date?: string;
    location?: string;
    status?: string;
    journal_id?: number | null;
    time?: string;
  };

  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editLocation, setEditLocation] = useState("");

  useEffect(() => {
    setUserId(localStorage.getItem("user_id"));
  }, []);

  useEffect(() => {
    async function fetchRequest() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/jobs/${id}`);
        if (res.ok) {
          const data = await res.json();
          setRequest({
            id: String(data.id),
            client_id: data.client_id,
            service: data.service,
            urgency: data.urgency,
            notes: data.notes,
            service_date: data.date,
            location: data.location,
            status: data.status,
            journal_id: data.journal_id,
            time: data.time,
          });
          setEditDate(data.date || "");
          setEditLocation(data.location || "");
        } else {
          setError("Failed to load request details");
        }
      } catch {
        setError("Failed to load request details");
      }
      setLoading(false);
    }
    if (id) fetchRequest();
  }, [id]);

  const handleAction = async (action: "accept" | "deny", serviceDate?: string) => {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/jobs/${id}/${action}`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "X-User-Id": String(userId) 
        },
        body: JSON.stringify({ service_date: serviceDate }),
      });
      if (res.ok) {
        router.push("/requests");
      } else {
        const data = await res.json();
        setActionError(data?.message || `Failed to ${action} request.`);
      }
    } catch {
      setActionError(`Failed to ${action} request.`);
    }
    setActionLoading(false);
  };

  const handleEdit = async () => {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/jobs/${id}/edit`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId)
        },
        body: JSON.stringify({ date: editDate, location: editLocation }),
      });
      if (res.ok) {
        setShowEditModal(false);
        window.location.reload();
      } else {
        const data = await res.json();
        setActionError(data?.message || "Failed to update request.");
      }
    } catch {
      setActionError("Failed to update request.");
    }
    setActionLoading(false);
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!request) return <div className="p-6">Request not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Job Details</h1>
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <p><span className="font-semibold">Service:</span> {request.service}</p>
        <p><span className="font-semibold">Urgency:</span> {request.urgency}</p>
        <p><span className="font-semibold">Notes:</span> {request.notes}</p>
        <p><span className="font-semibold">Status:</span> {request.status}</p>
        {request.service_date && (
          <p><span className="font-semibold">Date of Service:</span> {request.service_date}</p>
        )}
        {request.time && (
          <p><span className="font-semibold">Time:</span> {request.time}</p>
        )}
        {request.location && (
          <p><span className="font-semibold">Location:</span> {request.location}</p>
        )}
        {request.status === "pending" && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => handleAction("accept")}
              disabled={actionLoading}
              className="bg-green-600 text-white px-4 py-2 rounded font-semibold shadow transition duration-150 ease-in-out hover:bg-green-700 hover:scale-105 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              Accept
            </button>
            <button
              onClick={() => handleAction("deny")}
              disabled={actionLoading}
              className="bg-red-600 text-white px-4 py-2 rounded font-semibold shadow transition duration-150 ease-in-out hover:bg-red-700 hover:scale-105 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Decline
            </button>
          </div>
        )}
        {showDateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xs">
              <h2 className="text-lg font-bold mb-4">Set Appointment Date & Time</h2>
              <input
                type="datetime-local"
                value={selectedDateTime}
                onChange={e => setSelectedDateTime(e.target.value)}
                className="border rounded px-2 py-1 w-full mb-4"
              />
              <button
                onClick={() => { setShowDateModal(false); handleAction("accept", selectedDateTime); }}
                disabled={!selectedDateTime || actionLoading}
                className="bg-green-600 text-white px-4 py-2 rounded font-semibold w-full mb-2"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowDateModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {request.status === "accepted" && (
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold mb-4 shadow transition duration-150 ease-in-out hover:bg-blue-700 hover:scale-105 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Edit Appointment
          </button>
        )}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">Edit Service Request</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleEdit();
                }}
              >
                <label className="block mb-2 font-semibold">Date & Time</label>
                <input
                  type="datetime-local"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="border rounded px-2 py-1 w-full mb-4"
                />
                <label className="block mb-2 font-semibold">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  className="border rounded px-2 py-1 w-full mb-4"
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded font-semibold w-full mb-2 shadow transition duration-150 ease-in-out hover:bg-blue-700 hover:scale-105 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold w-full shadow transition duration-150 ease-in-out hover:bg-gray-300 hover:scale-105 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                {actionError && <p className="text-red-600 mt-2">{actionError}</p>}
              </form>
            </div>
          </div>
        )}
        {actionError && <p className="text-red-600 mt-2">{actionError}</p>}
        {request.status !== "denied" && (
          <button
            onClick={async () => {
              setActionLoading(true);
              setActionError("");
              try {
                const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/jobs/${id}/complete`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-User-Id": String(userId)
                  }
                });
                if (res.ok) {
                  window.location.reload();
                } else {
                  const data = await res.json();
                  setActionError(data?.message || "Failed to mark as complete.");
                }
              } catch {
                setActionError("Failed to mark as complete.");
              }
              setActionLoading(false);
            }}
            disabled={actionLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded font-semibold mb-4 shadow transition duration-150 ease-in-out hover:bg-purple-700 hover:scale-105 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            Mark Service as Complete
          </button>
        )}
        <button
          onClick={async () => {
            if (!window.confirm("Are you sure you want to delete this service request? This action cannot be undone.")) return;
            setActionLoading(true);
            setActionError("");
            try {
              const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/jobs/${id}`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  "X-User-Id": String(userId)
                }
              });
              if (res.ok) {
                router.push("/requests");
              } else {
                const data = await res.json();
                setActionError(data?.message || "Failed to delete request.");
              }
            } catch {
              setActionError("Failed to delete request.");
            }
            setActionLoading(false);
          }}
          disabled={actionLoading}
          className="bg-red-700 text-white px-4 py-2 rounded font-semibold mb-4 shadow transition duration-150 ease-in-out hover:bg-red-800 hover:scale-105 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Delete Service Request
        </button>
      </div>
    </div>
  );
}