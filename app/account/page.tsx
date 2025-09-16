"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";

type Admin = {
  id: number;
  name: string;
  email: string;
  address?: string;
  license_number?: string;
  license_expiration?: string;
  two_factor_enabled?: boolean;
  notification_enabled?: boolean;
};

export default function AccountPage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Admin>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId);
    if (storedId) {
      fetch(`https://schirmer-s-notary-backend.onrender.com/admin/profile`, {
        headers: { "X-User-Id": String(storedId) },
      })
        .then((res) => res.json())
        .then((data) => {
          setAdmin(data.admin || null);
          setEditData(data.admin || {});
        })
        .catch(() => setAdmin(null))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setEditLoading(true);
    setMessage("");
    try {
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId),
        },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (res.ok) {
        setAdmin(data.admin || null);
        setMessage("✅ Profile updated.");
        setEditMode(false);
      } else {
        setMessage(data?.message || "Failed to update profile.");
      }
    } catch {
      setMessage("Failed to update profile.");
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!admin) return <div className="p-6 text-red-600">Admin profile not found.</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-6">
      {/* Info Card */}
      <Card className="w-full max-w-lg shadow-md rounded-2xl mb-8">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Admin Account Info
          </h1>
          <div>
            <p><span className="font-semibold">Name:</span> {admin.name}</p>
            <p><span className="font-semibold">Email:</span> {admin.email}</p>
            <p><span className="font-semibold">Address:</span> {admin.address || "-"}</p>
            <p><span className="font-semibold">License #:</span> {admin.license_number || "-"}</p>
            <p><span className="font-semibold">License Expiration:</span> {admin.license_expiration || "-"}</p>
            <p>
              <span className="font-semibold">Two-Factor Enabled:</span>{" "}
              {admin.two_factor_enabled ? "Yes" : "No"}
            </p>
            <p>
              <span className="font-semibold">Notifications:</span>{" "}
              {admin.notification_enabled ? "Enabled" : "Disabled"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Card */}
      <Card className="w-full max-w-lg shadow-md rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Edit Account Info
          </h2>
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <Input
              name="name"
              type="text"
              placeholder="Name"
              value={editData.name ?? ""}
              onChange={handleEditChange}
            />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={editData.email ?? ""}
              onChange={handleEditChange}
            />
            <Input
              name="address"
              type="text"
              placeholder="Address"
              value={editData.address ?? ""}
              onChange={handleEditChange}
            />
            <Input
              name="license_number"
              type="text"
              placeholder="License Number"
              value={editData.license_number ?? ""}
              onChange={handleEditChange}
            />
            <Input
              name="license_expiration"
              type="text"
              placeholder="License Expiration"
              value={editData.license_expiration ?? ""}
              onChange={handleEditChange}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="two_factor_enabled"
                checked={!!editData.two_factor_enabled}
                onChange={handleEditChange}
                id="twofa"
              />
              <label htmlFor="twofa" className="text-sm font-medium text-gray-600">
                Two-Factor Enabled
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="notification_enabled"
                checked={!!editData.notification_enabled}
                onChange={handleEditChange}
                id="notify"
              />
              <label htmlFor="notify" className="text-sm font-medium text-gray-600">
                Notifications Enabled
              </label>
            </div>
            <Button type="submit" disabled={editLoading}>
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
          {message && (
            <p
              className={`text-sm font-medium ${
                message.startsWith("✅") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}