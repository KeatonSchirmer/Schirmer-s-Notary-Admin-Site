"use client";
import React, { useState } from "react";
import { Card, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [loading2FA, setLoading2FA] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  React.useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    setUserId(storedId);
    if (storedId) {
      fetch(`https://schirmer-s-notary-backend.onrender.com/auth/twofa/status`, {
        headers: { "X-User-Id": String(storedId) },
      })
        .then((res) => res.json())
        .then((data) => setTwoFAEnabled(!!data.enabled))
        .catch(() => setTwoFAEnabled(false));
    }
  }, []);

  const handleUpdateEmail = async () => {
    if (!userId) return;
    setLoadingEmail(true);
    setMessage("");
    try {
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/profile/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId),
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(
        res.ok
          ? "✅ Email updated successfully."
          : data?.message || "Failed to update email."
      );
    } catch {
      setMessage("Failed to update email.");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!userId) return;
    setLoadingPassword(true);
    setMessage("");
    try {
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId),
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      setMessage(
        res.ok
          ? "✅ Password changed successfully."
          : data?.message || "Failed to change password."
      );
    } catch {
      setMessage("Failed to change password.");
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    if (!userId) return;
    setLoading2FA(true);
    setMessage("");
    try {
      // Always send code: "123456" for dummy backend
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/auth/twofa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId),
        },
        body: JSON.stringify({ enable: !twoFAEnabled, code: "123456" }),
      });
      const data = await res.json();
      // Use backend response to set enabled/disabled state
      setTwoFAEnabled(data.enabled ?? !twoFAEnabled);
      setMessage(
        res.ok
          ? data.enabled
            ? "✅ 2FA enabled."
            : "✅ 2FA disabled."
          : data?.message || "❌ Failed to update 2FA."
      );
    } catch {
      setMessage("❌ Failed to update 2FA.");
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    setDeleteLoading(true);
    setMessage("");
    try {
      const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/profile/delete`, {
        method: "DELETE",
        headers: {
          "X-User-Id": String(userId),
        },
      });
      const data = await res.json();
      setMessage(
        res.ok
          ? "✅ Account deleted."
          : data?.message || "Failed to delete account."
      );
      // Optionally redirect or log out
    } catch {
      setMessage("Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    window.location.href = "/";
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-6">
      <Card className="w-full max-w-lg shadow-md rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Account Settings
          </h1>

          {/* Email Update */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Email</label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter new email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleUpdateEmail} disabled={loadingEmail}>
                {loadingEmail ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>

          {/* Password Update */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">
              New Password
            </label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={handleChangePassword} disabled={loadingPassword}>
                {loadingPassword ? "Changing..." : "Change"}
              </Button>
            </div>
          </div>

          {/* 2FA Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">
              Two-Factor Authentication (2FA)
            </label>
            <div className="flex gap-2 items-center">
              <Button
                onClick={handleToggle2FA}
                disabled={loading2FA}
                variant={twoFAEnabled ? "destructive" : "default"}
              >
                {loading2FA
                  ? twoFAEnabled
                    ? "Disabling..."
                    : "Enabling..."
                  : twoFAEnabled
                  ? "Disable 2FA"
                  : "Enable 2FA"}
              </Button>
              <span
                className={`text-xs font-semibold ${
                  twoFAEnabled ? "text-green-600" : "text-gray-400"
                }`}
              >
                {twoFAEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>

          {/* Delete Account & Logout Buttons */}
          <div className="flex gap-4 mt-6">
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              variant="destructive"
            >
              {deleteLoading ? "Deleting..." : "Delete Account"}
            </Button>
            <Button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="bg-red-600 text-white mt-4"
            >
              {logoutLoading ? "Logging out..." : "Log Out"}
            </Button>
          </div>

          {/* Feedback */}
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