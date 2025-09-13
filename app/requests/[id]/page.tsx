"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  type RequestDetails = {
    id: string;
    name: string;
    email: string;
    phone: string;
    service: string;
    urgency: string;
    notes: string;
    progress: string;
    service_date?: string;
    location?: string;
    status?: string;
    document_type?: string;
    signers?: string;
    witnesses?: number;
    wording?: string;
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
  const [editDate, setEditDate] = useState(request?.service_date || "");
  const [editLocation, setEditLocation] = useState(request?.location || "");

  useEffect(() => {
    setUserId(localStorage.getItem("user_id"));
  }, []);

  useEffect(() => {
    async function updateStatusAndFetchRequest() {
      setLoading(true);
      setError("");
      try {
        await fetch("https://schirmer-s-notary-backend.onrender.com/jobs/admin/accepted/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
      } catch {}
      const endpoints = [
        `https://schirmer-s-notary-backend.onrender.com/jobs/admin/request/${id}`,
        `https://schirmer-s-notary-backend.onrender.com/jobs/admin/accepted/${id}`,
        `https://schirmer-s-notary-backend.onrender.com/jobs/admin/denied/${id}`
      ];
      let found = false;
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint);
          if (res.ok) {
            const data = await res.json();
            setRequest(data);
            found = true;
            break;
          }
        } catch {}
      }
      if (!found) setError("Failed to load request details");
      setLoading(false);
    }
    if (id) updateStatusAndFetchRequest();
  }, [id]);

  useEffect(() => {
    if (request) {
      setEditDate(request.service_date || "");
      setEditLocation(request.location || "");
    }
  }, [request]);

  const handleAction = async (action: "accept" | "deny", serviceDate?: string) => {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/jobs/admin/request/${id}/${action}`, {
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
        console.log("Fetched request data:", data);
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
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/jobs/admin/accepted/${id}/edit`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId)
        },
        body: JSON.stringify({ service_date: editDate, location: editLocation }),
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
        <p><span className="font-semibold">Name:</span> {request.name}</p>
        <p><span className="font-semibold">Email:</span> {request.email}</p>
        <p><span className="font-semibold">Phone:</span> {request.phone}</p>
        <p><span className="font-semibold">Service:</span> {request.service}</p>
        <p><span className="font-semibold">Urgency:</span> {request.urgency}</p>
        <p><span className="font-semibold">Notes:</span> {request.notes}</p>
        <p><span className="font-semibold">Progress:</span> {request.progress}</p>
        {request.service_date && (
          <p><span className="font-semibold">Date of Service:</span> {
            (() => {
              try {
                const dateStr = request.service_date.length === 10
                  ? request.service_date + 'T00:00:00'
                  : request.service_date;
                const dateObj = new Date(dateStr);
                return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } catch {
                return request.service_date;
              }
            })()
          }</p>
        )}
        {request.location && (
          <p><span className="font-semibold">Location:</span> {request.location}</p>
        )}
        {request.status === "pending" && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setShowDateModal(true)}
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
            <p className="mr-2">Edit</p>
        )}
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded font-semibold mb-4 shadow transition duration-150 ease-in-out hover:bg-blue-700 hover:scale-105 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Edit Appointment
            </button>
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
                <label className="block mb-2 font-semibold">Name</label>
                <input
                  type="text"
                  value={request.name || ""}
                  onChange={e => setRequest({ ...request, name: e.target.value })}
                  className="border rounded px-2 py-1 w-full mb-4"
                />
                <label className="block mb-2 font-semibold">Document Type</label>
                <input
                  type="text"
                  value={request.document_type || ""}
                  onChange={e => setRequest({ ...request, document_type: e.target.value })}
                  className="border rounded px-2 py-1 w-full mb-4"
                />
                <label className="block mb-2 font-semibold">Signers</label>
                <input
                  type="text"
                  value={request.signers || ""}
                  onChange={e => setRequest({ ...request, signers: e.target.value })}
                  className="border rounded px-2 py-1 w-full mb-4"
                />
                <label className="block mb-2 font-semibold">Witnesses</label>
                <input
                  type="number"
                  value={request.witnesses || 0}
                  onChange={e => setRequest({ ...request, witnesses: Number(e.target.value) })}
                  className="border rounded px-2 py-1 w-full mb-4"
                />
                <label className="block mb-2 font-semibold">Location</label>
                <input
                  type="text"
                  value={request.location || ""}
                  onChange={e => setRequest({ ...request, location: e.target.value })}
                  className="border rounded px-2 py-1 w-full mb-4"
                />
                <label className="block mb-2 font-semibold">Date & Time</label>
                <input
                  type="datetime-local"
                  value={request.service_date || ""}
                  onChange={e => setRequest({ ...request, service_date: e.target.value })}
                  className="border rounded px-2 py-1 w-full mb-4"
                />
                <div className="mb-4 text-sm text-gray-600">
                  Current Service Date: <span className="font-semibold">
                    {request.service_date
                      ? (() => {
                          try {
                            const dateStr = request.service_date.length === 10
                              ? request.service_date + 'T00:00:00'
                              : request.service_date;
                            const dateObj = new Date(dateStr);
                            return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          } catch {
                            return request.service_date;
                          }
                        })()
                      : "Not set"}
                  </span>
                </div>
                <label className="block mb-2 font-semibold">Wording/Notes</label>
                <textarea
                  value={request.wording || ""}
                  onChange={e => setRequest({ ...request, wording: e.target.value })}
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
        {request.status === "in progress" && (
          <p>In Progress</p>
        )}
        {/* Only show 'Mark Service as Complete' if not denied */}
        {request.status !== "denied" && (
          <button
            onClick={async () => {
              setActionLoading(true);
              setActionError("");
              try {
                const res = await fetch(`http://localhost:5000/jobs/admin/accepted/${request.id}/complete`, {
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
            let endpoint = "";
            const acceptedProgress = ["accepted", "upcoming", "in_progress", "complete", "completed"];
            const status = request.status;
            const progress = request.progress;
            if (status === "pending") {
              endpoint = `http://localhost:5000/jobs/admin/request/${request.id}`;
            } else if (status === "denied") {
              endpoint = `http://localhost:5000/jobs/admin/denied/${request.id}`;
            } else if (
              (status && acceptedProgress.includes(status)) ||
              status === "accepted" ||
              (progress && acceptedProgress.includes(progress))
            ) {
              endpoint = `http://localhost:5000/jobs/admin/accepted/${request.id}`;
            } else if (!status && progress && acceptedProgress.includes(progress)) {
              // If status is undefined but progress matches accepted, treat as accepted
              endpoint = `http://localhost:5000/jobs/admin/accepted/${request.id}`;
            } else {
              setActionError("Cannot delete: Unknown or unsupported job status.");
              setActionLoading(false);
              return;
            }
            try {
              const res = await fetch(endpoint, {
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
