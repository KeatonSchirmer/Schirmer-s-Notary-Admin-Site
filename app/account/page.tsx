"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";

type Admin = {
  id?: number;
  name?: string;
  email?: string;
  address?: string;
  license_number?: string;
  license_expiration?: string;
  two_factor_enabled?: boolean;
};

export default function AccountPage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Admin>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [show2FAEmailSent, setShow2FAEmailSent] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");

  const handleLogout = async () => {
    try {
      await fetch("https://schirmer-s-notary-backend.onrender.com/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      localStorage.removeItem("user_id");
      window.location.href = "/";
    } catch {
      alert("Logout failed.");
    }
  };  

  useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId);
    if (storedId) {
      fetch(`https://schirmer-s-notary-backend.onrender.com/auth/profile`, {
        headers: { "X-User-Id": String(storedId) },
      })
        .then((res) => res.json())
        .then((data) => {
          setAdmin(data || null);
          setEditData(data || {});
        })
        .catch(() => setAdmin(null))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setEditLoading(true);
    setMessage("");
    try {
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/auth/profile/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId),
        },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (res.ok) {
        setAdmin(data || null);
        setMessage("Profile updated.");
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

  // 2FA logic
  const handleRequest2FA = async () => {
    if (!userId) return;
    try {
      await fetch(
        'https://schirmer-s-notary-backend.onrender.com/auth/twofa/request',
        {
          method: "POST",
          headers: { "X-User-Id": String(userId) },
        }
      );
      setShow2FAEmailSent(true);
      setMessage("Confirmation Email Sent. Check your email for a code to enable 2FA.");
    } catch {
      setMessage("Failed to send confirmation email.");
    }
  };

  const handleConfirm2FA = async () => {
    if (!userId) return;
    try {
      await fetch(
        'https://schirmer-s-notary-backend.onrender.com/auth/twofa/confirm',
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": String(userId),
          },
          body: JSON.stringify({ code: confirmationCode }),
        }
      );
      setAdmin((prev) => ({ ...prev, two_factor_enabled: true }));
      setShow2FAModal(false);
      setShow2FAEmailSent(false);
      setConfirmationCode("");
      setMessage("✅ Two-Factor Authentication enabled.");
    } catch {
      setMessage("Invalid or expired code.");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!admin) return <div className="p-6 text-red-600">Profile not found.</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-6">
      {/* Info Card */}
      <Card className="w-full max-w-lg shadow-md rounded-2xl mb-8 relative">
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
              <Button
                variant="outline"
                className="ml-2"
                onClick={() => setShow2FAModal(true)}
                size="sm"
              >
                {admin.two_factor_enabled ? "Manage" : "Enable"}
              </Button>
            </p>
          </div>
          {/* Edit button in bottom right corner */}
          <Button
            variant="default"
            className="absolute bottom-4 right-4"
            onClick={() => setEditMode(true)}
            size="sm"
          >
            Edit
          </Button>
        </CardContent>
      </Card>

      {/* Edit Card (only appears after pressing Edit) */}
      {editMode && (
        <Card className="w-full max-w-lg shadow-md rounded-2xl mb-8">
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
              <div className="flex gap-2">
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
              </div>
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
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            className="bg-white rounded-2xl shadow p-6 w-full max-w-md space-y-4"
            onSubmit={e => { e.preventDefault(); handleConfirm2FA(); }}
          >
            <h2 className="text-lg font-semibold mb-2">Two-Factor Authentication</h2>
            <p className="mb-2">Enable extra security for your account.</p>
            {!admin.two_factor_enabled && !show2FAEmailSent && (
              <Button type="button" onClick={handleRequest2FA}>
                Send Confirmation Email
              </Button>
            )}
            {show2FAEmailSent && !admin.two_factor_enabled && (
              <>
                <Input
                  type="text"
                  placeholder="Enter confirmation code"
                  value={confirmationCode}
                  onChange={e => setConfirmationCode(e.target.value)}
                />
                <Button type="submit">Confirm 2FA Setup</Button>
              </>
            )}
            {admin.two_factor_enabled && (
              <p className="text-green-600 mb-2">Two-Factor Authentication is enabled.</p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShow2FAModal(false);
                setShow2FAEmailSent(false);
                setConfirmationCode("");
              }}
            >
              Cancel
            </Button>
          </form>
        </div>
      )}

          {/* Logout Button */}
          <Button
            variant="destructive"
            className="mt-8"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
    );
}