"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

type Client = {
  id: string;
  name: string;
  email: string;
  company?: string;
};

type GroupedClients = {
  [company: string]: Client[];
};

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [company, setCompany] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId);
  }, []);

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://schirmer-s-notary-backend.onrender.com/clients/all", {
          headers: { "Content-Type": "application/json", "X-User-Id": String(userId) },
        });
        const data = await res.json();
        setClients(data.clients || []);
      } catch {
        setError("Failed to load clients");
      }
      setLoading(false);
    }
    fetchClients();
  }, [userId]);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      (client.company &&
        client.company.toLowerCase().includes(search.toLowerCase())) ||
      client.email.toLowerCase().includes(search.toLowerCase())
  );

  // Group clients by company (or by their name if no company)
  const groupedClients: GroupedClients = {};
  const ungroupedClients: Client[] = [];

  filteredClients.forEach((client) => {
    let companyName = "";
    if (client.company) {
      if (typeof client.company === "object" && client.company.name) {
        companyName = client.company.name;
      } else if (typeof client.company === "string" && client.company.trim() !== "") {
        companyName = client.company.trim();
      }
    }
    if (companyName) {
      if (!groupedClients[companyName]) groupedClients[companyName] = [];
      groupedClients[companyName].push(client);
    } else {
      ungroupedClients.push(client);
    }
  });

  const companyNames = Object.keys(groupedClients);

  const handleAddClient = async () => {
    try {
      const res = await fetch("https://schirmer-s-notary-backend.onrender.com/clients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": String(userId) },
        body: JSON.stringify({
          name: clientName,
          email: clientEmail,
          company_name: company,
        }),
      });
      if (res.ok) {
        const newClient = await res.json();
        setClients((prev) => [...prev, {
          id: newClient.id,
          name: newClient.name,
          email: newClient.email,
          company: company,
        }]);
        setShowClientModal(false);
        setClientName("");
        setClientEmail("");
        setCompany("");
      }
    } catch {
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Clients</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md mb-6 p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
      />

      {/* Companies list */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : companyNames.length === 0 && ungroupedClients.length === 0 ? (
        <p className="text-gray-500">No clients found.</p>
      ) : (
        <div>
          {/* Company cards with dropdown */}
          {companyNames.map((company) => (
            <div key={company} className="mb-6">
              <button
                className="w-full text-left bg-white rounded-xl shadow p-4 flex justify-between items-center cursor-pointer hover:bg-green-50 transition"
                onClick={() => setSelectedCompany(selectedCompany === company ? null : company)}
              >
                <span className="text-lg font-semibold text-gray-700">{company}</span>
                <span className="text-green-700 font-bold">
                  {selectedCompany === company ? "▲" : "▼"}
                </span>
              </button>
              {selectedCompany === company && (
                <div className="space-y-3 mt-3">
                  {groupedClients[company].map((client) => (
                    <Link href={`/clients/${client.id}`} passHref key={client.id}>
                      <div
                        className="bg-white rounded-xl shadow p-4 flex justify-between items-center cursor-pointer hover:bg-green-100 transition"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{client.name}</p>
                          <p className="text-sm text-gray-500">{client.email}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {/* Individual client cards (no dropdown) */}
          {ungroupedClients.map((client) => (
            <Link href={`/clients/${client.id}`} passHref key={client.id}>
              <div className="bg-white rounded-xl shadow p-4 flex justify-between items-center cursor-pointer hover:bg-green-100 transition mb-6">
                <div>
                  <span className="text-lg font-semibold text-gray-700">{client.name}</span>
                  <p className="text-sm text-gray-500">{client.email}</p>
                </div>
                <span className="text-green-700 font-bold">View</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showClientModal && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add New Client</h2>
            <input
              type="text"
              placeholder="Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full mb-3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
            />
            <input
              type="email"
              placeholder="Email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full mb-3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
            />
            <input
              type="text"
              placeholder="Company (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
            />
            <button
              onClick={handleAddClient}
              className="w-full bg-green-700 text-white py-2 rounded-lg font-medium hover:bg-green-800 transition mb-2"
            >
              Save
            </button>
            <button
              onClick={() => setShowClientModal(false)}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;