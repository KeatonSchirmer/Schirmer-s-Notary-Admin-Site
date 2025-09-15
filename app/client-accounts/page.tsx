"use client";
import React, { useEffect, useState } from "react";

type Client = {
  id: string | number;
  name: string;
  email: string;
  premiumPlan: string;
  paymentHistory: { date: string; amount: number; status: string }[];
  pastDue: boolean;
};

export default function ClientAccountsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; email: string; premiumPlan: string }>({ name: "", email: "", premiumPlan: "" });

  useEffect(() => {
    fetch("/api/clients")
      .then(res => res.json())
      .then(data => setClients(data.clients || []));
  }, []);

  // Select client for editing
  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setEditForm({ name: client.name, email: client.email, premiumPlan: client.premiumPlan });
  };

  // Save client edits
  const handleSave = async () => {
    if (!selectedClient) return;
    await fetch(`/api/clients/${selectedClient.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setSelectedClient(null);
    // Refresh client list
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data.clients || []);
  };

  // Send account confirmation email
  const handleSendConfirmation = async (clientId: string | number) => {
    await fetch(`/api/clients/${clientId}/send-confirmation`, { method: "POST" });
    alert("Confirmation email sent!");
  };

  // Create new client profile
  const handleCreateClient = async () => {
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditForm({ name: "", email: "", premiumPlan: "" });
    // Refresh client list
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data.clients || []);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Client Accounts</h1>

      {/* Create Client */}
      <div className="mb-8 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Create New Client</h2>
        <input
          type="text"
          placeholder="Name"
          value={editForm.name}
          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
          className="border rounded p-2 mr-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={editForm.email}
          onChange={e => setEditForm({ ...editForm, email: e.target.value })}
          className="border rounded p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Premium Plan"
          value={editForm.premiumPlan}
          onChange={e => setEditForm({ ...editForm, premiumPlan: e.target.value })}
          className="border rounded p-2 mr-2"
        />
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleCreateClient}
        >
          Create Client
        </button>
      </div>

      {/* Client List */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Existing Clients</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Premium Plan</th>
              <th>Past Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id} className={client.pastDue ? "bg-red-100" : ""}>
                <td>{client.name}</td>
                <td>{client.email}</td>
                <td>{client.premiumPlan}</td>
                <td>{client.pastDue ? "Yes" : "No"}</td>
                <td>
                  <button className="text-blue-600 mr-2" onClick={() => handleEdit(client)}>Edit</button>
                  <button className="text-green-600 mr-2" onClick={() => handleSendConfirmation(client.id)}>Send Confirmation</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form className="bg-white p-6 rounded shadow w-full max-w-lg space-y-3" onSubmit={e => { e.preventDefault(); handleSave(); }}>
            <h2 className="text-lg font-semibold mb-2">Edit Client</h2>
            <input
              type="text"
              value={editForm.name}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <input
              type="email"
              value={editForm.email}
              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              value={editForm.premiumPlan}
              onChange={e => setEditForm({ ...editForm, premiumPlan: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <h3 className="font-semibold mt-4 mb-2">Payment History</h3>
            <ul className="mb-2">
              {selectedClient.paymentHistory.map((p, idx) => (
                <li key={idx} className={p.status === "past_due" ? "text-red-600" : ""}>
                  {p.date}: ${p.amount} - {p.status}
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
              <button type="button" className="bg-gray-300 text-gray-800 px-4 py-2 rounded" onClick={() => setSelectedClient(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
