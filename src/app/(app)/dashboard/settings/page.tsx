"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    companyName: "Acme Innovations",
    email: "admin@acme.com",
    notifications: true,
  });

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure dashboard preferences and organization details.</p>
      </div>
      <div className="summary-cards">
        <div className="card"><h3>Account Status</h3><strong>Verified</strong></div>
        <div className="card"><h3>Plan</h3><strong>Enterprise</strong></div>
      </div>
      <div className="table-wrapper" style={{ padding: "1.5rem" }}>
        <h3>Organization Details</h3>
        <p><strong>Company:</strong> {profile.companyName}</p>
        <p><strong>Admin Email:</strong> {profile.email}</p>
        <p><strong>Email Notifications:</strong> {profile.notifications ? "Enabled" : "Disabled"}</p>
      </div>
    </div>
  );
}