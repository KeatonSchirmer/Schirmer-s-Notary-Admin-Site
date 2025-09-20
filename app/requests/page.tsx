"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type RequestItem = {
  id: number;
  client_id: number;
  name: string;
  status: string;
};

type RawRequest = {
  id: number;
  client_id: number;
  status: string;
};

async function getClientLabel(client_id: number): Promise<string> {
  try {
    const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/clients/${client_id}`);
    if (!res.ok) return "Unnamed";
    const data = await res.json();
    if (data.company) {
      if (typeof data.company === "object" && data.company.name) {
        return data.company.name;
      }
      if (typeof data.company === "string" && data.company.trim()) {
        return data.company.trim();
      }
    }
    return data.name || "Unnamed";
  } catch {
    return "Unnamed";
  }
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = React.useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'denied'>('all');

  React.useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId);
  }, []);

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://schirmer-s-notary-backend.onrender.com/jobs/", {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": String(userId),
          },
        });
        const data = await res.json();
        let items: RequestItem[] = [];
        if (Array.isArray(data)) {
          items = await Promise.all(
            data.map(async (req: RawRequest) => ({
              id: req.id,
              client_id: req.client_id,
              name: await getClientLabel(req.client_id),
              status: req.status,
            }))
          );
        }
        setRequests(items);
      } catch {
        setError("Failed to load requests");
      }
      setLoading(false);
    }
    if (userId) {
      fetchRequests();
    }
  }, [userId]);

  const filteredRequests =
    filter === 'all'
      ? requests
      : requests.filter((req) => req.status === filter);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Jobs</h1>
      <div className="mb-4 flex gap-2">
        <button
          className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`px-3 py-1 rounded ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`px-3 py-1 rounded ${filter === 'accepted' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('accepted')}
        >
          Accepted
        </button>
        <button
          className={`px-3 py-1 rounded ${filter === 'denied' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('denied')}
        >
          Declined
        </button>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : filteredRequests.length === 0 ? (
        <p className="text-gray-500">No requests found.</p>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <Link href={`/requests/${req.id}`} key={req.id + '-' + req.status}>
              <div className="bg-white p-4 rounded-2xl shadow flex justify-between items-center cursor-pointer hover:bg-gray-100">
                <div>
                  <span className="font-semibold">
                    {req.name || "Unnamed"}
                  </span>{" "}
                  <span className="text-gray-500">({req.status})</span>
                </div>
                <span className="text-blue-600">View Details</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}