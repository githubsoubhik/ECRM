"use client";

import { useState } from "react";

interface Ticket {
  id: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  date: string;
}

export default function SupportPage() {
  const [tickets] = useState<Ticket[]>([
    {
      id: 101,
      subject: "Unable to export monthly reports",
      category: "Technical Issue",
      priority: "High",
      status: "Open",
      date: "2026-03-10",
    },
    {
      id: 102,
      subject: "Billing inquiry regarding invoice #1092",
      category: "Billing",
      priority: "Medium",
      status: "In Progress",
      date: "2026-03-08",
    },
    {
      id: 103,
      subject: "Request for adding new team permissions",
      category: "Feature Request",
      priority: "Low",
      status: "Resolved",
      date: "2026-03-02",
    },
  ]);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Help & Support</h1>
          <p>Get assistance with your dashboard, submit tickets, and contact support.</p>
        </div>
        <button className="download-report-btn">Create New Ticket</button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Open Tickets</h3>
          <strong>2</strong>
        </div>
        <div className="card">
          <h3>Avg Response Time</h3>
          <strong>2 hrs</strong>
        </div>
        <div className="card">
          <h3>Resolved Tickets</h3>
          <strong>14</strong>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Date Created</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>#{ticket.id}</td>
                <td>{ticket.subject}</td>
                <td>{ticket.category}</td>
                <td>{ticket.priority}</td>
                <td>{ticket.date}</td>
                <td>{ticket.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}