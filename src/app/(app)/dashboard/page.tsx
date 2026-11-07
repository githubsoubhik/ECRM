"use client";

import React, { useState } from "react";

import { Role, ROLES } from "../components/auth/access/roles";

import "../../globals.css" // Fixed missing closing quote
import {
  FiUsers,
  FiBriefcase,
  FiUserCheck,
  FiDollarSign,
  FiCalendar,
  FiPlus,
  FiChevronRight,
  FiMenu,
  FiX,
  FiClock,
} from "react-icons/fi";
import Sidebar from "../components/DashboardComponent/Sidebar";

interface ChartDataItem {
  completed: number;
  inProgress: number;
  planning: number;
  onHold: number;
}

export default function DashboardPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Month labels and dummy stacked data matching the reference dashboard
  const months: string[] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  const chartData: ChartDataItem[] = [
    { completed: 40, inProgress: 25, planning: 15, onHold: 10 },
    { completed: 35, inProgress: 20, planning: 10, onHold: 15 },
    { completed: 50, inProgress: 30, planning: 10, onHold: 5 },
    { completed: 45, inProgress: 20, planning: 15, onHold: 10 },
    { completed: 60, inProgress: 25, planning: 10, onHold: 5 },
    { completed: 55, inProgress: 15, planning: 20, onHold: 10 },
    { completed: 70, inProgress: 20, planning: 10, onHold: 5 },
    { completed: 65, inProgress: 25, planning: 15, onHold: 10 },
    { completed: 75, inProgress: 15, planning: 10, onHold: 5 },
  ];

  return (
    <div className="dashboard-layout">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Drawer Container */}
      <div className={`sidebar-wrapper ${mobileMenuOpen ? "open" : ""}`}>
   
      </div>

      {/* Main Area */}
      <main className="dashboard-main1">
        {/* Top Header */}
        <header className="dashboard-header">
          <div className="header-left">
            {/* <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="menu-toggle-btn"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button> */}
            <div>
              <span className="greeting-sub">Good morning,</span>
              <h1 className="user-name">Mr. Priyangshu</h1>
              <p className="greeting-desc">
                {/* Here's what's happening with your business today. */}
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="header-right">
            <div className="date-pill">
              <FiCalendar style={{ color: "#94a3b8" }} />
              <span>Tue, 8 Sept 2026</span>
            </div>
            <button
              className="create-btn"
              onClick={() => setShowCreateForm(true)}
            >
              <FiPlus size={16} />
              <span>Create New</span>
            </button>
          </div>
        </header>

        {/* Dashboard Main Content Area */}
        <div className="dashboard-content">
          {/* Top 4 Stats Cards */}
          <div className="stats-grid">
            {/* Active Clients */}
            <div className="dash-card stat-card-box">
              <div className="stat-icon-wrapper icon-blue">
                <FiUsers size={18} />
              </div>
              <div>
                <p className="stat-val">12</p>
                <div className="stat-bottom">
                  <span className="stat-label">Active Clients</span>
                  <span className="stat-badge">↑ 20%</span>
                </div>
              </div>
            </div>

            {/* Ongoing Projects */}
            <div className="dash-card stat-card-box">
              <div className="stat-icon-wrapper icon-indigo">
                <FiBriefcase size={18} />
              </div>
              <div>
                <p className="stat-val">18</p>
                <div className="stat-bottom">
                  <span className="stat-label">Ongoing Projects</span>
                  <span className="stat-badge">↑ 12%</span>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="dash-card stat-card-box">
              <div className="stat-icon-wrapper icon-rose">
                <FiUserCheck size={18} />
              </div>
              <div>
                <p className="stat-val">28</p>
                <div className="stat-bottom">
                  <span className="stat-label">Team Members</span>
                  <span className="stat-badge">↑ 7%</span>
                </div>
              </div>
            </div>

            {/* Revenue MTD */}
            <div className="dash-card stat-card-box">
              <div className="stat-icon-wrapper icon-amber">
                <FiDollarSign size={18} />
              </div>
              <div>
                <p className="stat-val">₹4.2L</p>
                <div className="stat-bottom">
                  <span className="stat-label">Revenue (MTD)</span>
                  <span className="stat-badge">↑ 18%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Progress Chart & Task Overview Donut Section */}
          <div className="charts-grid">
            {/* Bar Chart Section */}
            <div className="dash-card">
              <div className="chart-header">
                <h3 className="card-title">Project progress</h3>
                <div className="legend-list">
                  <div className="legend-item">
                    <span className="dot dot-completed"></span>
                    <span>Completed</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot dot-progress"></span>
                    <span>In progress</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot dot-planning"></span>
                    <span>Planning</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot dot-hold"></span>
                    <span>On hold</span>
                  </div>
                </div>
              </div>

              {/* Stacked Bar Chart Display */}
              <div className="bar-chart-container">
                {chartData.map((data, index) => (
                  <div key={index} className="bar-column">
                    <div className="bar-stack-wrapper">
                      <div
                        style={{ height: `${data.completed}%` }}
                        className="bar-seg-completed"
                      />
                      <div
                        style={{ height: `${data.inProgress}%` }}
                        className="bar-seg-progress"
                      />
                      <div
                        style={{ height: `${data.planning}%` }}
                        className="bar-seg-planning"
                      />
                      <div
                        style={{ height: `${data.onHold}%` }}
                        className="bar-seg-hold"
                      />
                    </div>
                    <span className="bar-label">{months[index]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Overview Ring Chart */}
            <div className="dash-card" style={{ display: "flex", flexDirection: "column" }}>
              <h3 className="card-title" style={{ marginBottom: "1rem" }}>
                Task overview
              </h3>

              <div className="ring-chart-body">
                {/* SVG Ring Visual Representation */}
                <div className="ring-visual">
                  <svg viewBox="0 0 36 36">
                    <path
                      stroke="#f97316"
                      strokeDasharray="45, 100"
                      strokeWidth="4"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="#0f172a"
                      strokeDasharray="25, 100"
                      strokeDashoffset="-45"
                      strokeWidth="4"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="#c7d2fe"
                      strokeDasharray="18, 100"
                      strokeDashoffset="-70"
                      strokeWidth="4"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="#fca5a5"
                      strokeDasharray="12, 100"
                      strokeDashoffset="-88"
                      strokeWidth="4"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="ring-inner-text">
                    <span className="ring-total">42</span>
                    <span className="ring-subtext">Total</span>
                  </div>
                </div>

                {/* Donut Chart Legend Items */}
                <div className="ring-legend-list">
                  <div className="ring-legend-item">
                    <span className="ring-legend-label">
                      <span className="dot dot-completed"></span>
                      Completed
                    </span>
                    <span className="ring-legend-val">18</span>
                  </div>
                  <div className="ring-legend-item">
                    <span className="ring-legend-label">
                      <span className="dot dot-progress"></span>
                      In progress
                    </span>
                    <span className="ring-legend-val">12</span>
                  </div>
                  <div className="ring-legend-item">
                    <span className="ring-legend-label">
                      <span className="dot dot-planning"></span>
                      Pending
                    </span>
                    <span className="ring-legend-val">8</span>
                  </div>
                  <div className="ring-legend-item">
                    <span className="ring-legend-label">
                      <span className="dot dot-hold"></span>
                      Overdue
                    </span>
                    <span className="ring-legend-val">4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid with 3 Cards Row */}
          <div className="lists-grid">
            {/* Recent Projects Card */}
            <div className="dash-card">
              <div className="list-card-header">
                <h3 className="card-title">Recent projects</h3>
                <button className="view-all-link">View all</button>
              </div>
              <div className="data-item-list">
                <div className="item-row">
                  <div className="item-left">
                    <div className="avatar-circle avatar-dark">PU</div>
                    <div>
                      <p className="item-title">PureAnus</p>
                      <p className="item-subtitle">Website Development</p>
                    </div>
                  </div>
                  <span className="status-tag">In progress</span>
                </div>

                <div className="item-row">
                  <div className="item-left">
                    <div className="avatar-circle avatar-dark">ZJ</div>
                    <div>
                      <p className="item-title">Zara Junction</p>
                      <p className="item-subtitle">Social Media Marketing</p>
                    </div>
                  </div>
                  <span className="status-tag">Planning</span>
                </div>

                <div className="item-row">
                  <div className="item-left">
                    <div className="avatar-circle avatar-dark">EC</div>
                    <div>
                      <p className="item-title">Ecstatics</p>
                      <p className="item-subtitle">Performance Marketing</p>
                    </div>
                  </div>
                  <span className="status-tag">On hold</span>
                </div>
              </div>
            </div>

            {/* Recent Clients Card */}
            <div className="dash-card">
              <div className="list-card-header">
                <h3 className="card-title">Recent clients</h3>
                <button className="view-all-link">View all</button>
              </div>
              <div className="data-item-list">
                <div className="item-row">
                  <div className="item-left">
                    <div className="avatar-circle avatar-emerald">PA</div>
                    <div>
                      <p className="item-title">PureAnus</p>
                      <p className="item-subtitle">Organic Skincare</p>
                    </div>
                  </div>
                  <div className="status-active-group">
                    <span className="badge-active">Active</span>
                    <FiChevronRight size={14} style={{ color: "#cbd5e1" }} />
                  </div>
                </div>

                <div className="item-row">
                  <div className="item-left">
                    <div className="avatar-circle avatar-blue">ZJ</div>
                    <div>
                      <p className="item-title">Zara Junction</p>
                      <p className="item-subtitle">Fashion & Retail</p>
                    </div>
                  </div>
                  <div className="status-active-group">
                    <span className="badge-active">Active</span>
                    <FiChevronRight size={14} style={{ color: "#cbd5e1" }} />
                  </div>
                </div>

                <div className="item-row">
                  <div className="item-left">
                    <div className="avatar-circle avatar-purple">E</div>
                    <div>
                      <p className="item-title">Ecstatics</p>
                      <p className="item-subtitle">Beauty & Cosmetics</p>
                    </div>
                  </div>
                  <div className="status-active-group">
                    <span className="badge-active">Active</span>
                    <FiChevronRight size={14} style={{ color: "#cbd5e1" }} />
                  </div>
                </div>

                <div className="item-row">
                  <div className="item-left">
                    <div className="avatar-circle avatar-amber">RM</div>
                    <div>
                      <p className="item-title">Ranibaz Makeover</p>
                      <p className="item-subtitle">Bridal Makeup</p>
                    </div>
                  </div>
                  <div className="status-active-group">
                    <span className="badge-active">Active</span>
                    <FiChevronRight size={14} style={{ color: "#cbd5e1" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members Card */}
            <div className="dash-card">
              <div className="list-card-header">
                <h3 className="card-title">Team members</h3>
                <button className="view-all-link">View all</button>
              </div>
              <div className="data-item-list">
                <div className="item-left">
                  <div className="avatar-circle avatar-gray">RD</div>
                  <div>
                    <p className="item-title">Orbit</p>
                    <p className="item-subtitle">Developer</p>
                  </div>
                </div>

                <div className="item-left">
                  <div className="avatar-circle avatar-gray">SN</div>
                  <div>
                    <p className="item-title">Sneha</p>
                    <p className="item-subtitle">Designer</p>
                  </div>
                </div>

                <div className="item-left">
                  <div className="avatar-circle avatar-gray">AM</div>
                  <div>
                    <p className="item-title">Aman</p>
                    <p className="item-subtitle">SEO Specialist</p>
                  </div>
                </div>

                <div className="item-left">
                  <div className="avatar-circle avatar-gray">PJ</div>
                  <div>
                    <p className="item-title">Pooka</p>
                    <p className="item-subtitle">Content Writer</p>
                  </div>
                </div>

                <div className="item-left">
                  <div className="avatar-circle avatar-gray">VK</div>
                  <div>
                    <p className="item-title">Vram</p>
                    <p className="item-subtitle">Project Manager</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Upcoming Schedule Card */}
          <div className="dash-card">
            <div className="list-card-header" style={{ marginBottom: "1.5rem" }}>
              <h3 className="card-title">Upcoming schedule</h3>
              <button className="view-all-link">View all</button>
            </div>

            <div className="schedule-section">
              {/* TODAY */}
              <div>
                <p className="schedule-group-title">TODAY</p>
                <div className="schedule-cards-grid">
                  <div className="schedule-item-card">
                    <div className="stat-icon-wrapper icon-amber">
                      <FiClock size={16} />
                    </div>
                    <div>
                      <p className="item-title">Client meeting with PureAyus</p>
                      <p className="item-subtitle" style={{ marginTop: "0.25rem" }}>
                        11:00 AM - 12:00 PM
                      </p>
                    </div>
                  </div>

                  <div className="schedule-item-card">
                    <div className="stat-icon-wrapper icon-amber">
                      <FiClock size={16} />
                    </div>
                    <div>
                      <p className="item-title">Review website design – Zari Junction</p>
                      <p className="item-subtitle" style={{ marginTop: "0.25rem" }}>
                        2:30 PM - 3:30 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TOMORROW */}
              <div>
                <p className="schedule-group-title">TOMORROW</p>
                <div className="schedule-cards-grid">
                  <div className="schedule-item-card">
                    <div className="stat-icon-wrapper icon-amber">
                      <FiClock size={16} />
                    </div>
                    <div>
                      <p className="item-title">Team sync meeting</p>
                      <p className="item-subtitle" style={{ marginTop: "0.25rem" }}>
                        10:00 AM - 11:00 AM
                      </p>
                    </div>
                  </div>

                  <div className="schedule-item-card">
                    <div className="stat-icon-wrapper icon-amber">
                      <FiClock size={16} />
                    </div>
                    <div>
                      <p className="item-title">Social media strategy discussion</p>
                      <p className="item-subtitle" style={{ marginTop: "0.25rem" }}>
                        4:00 PM - 5:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Create Form Modal */}

      {showCreateForm && (
        <div className="modal-overlay">

          <div className="create-modal">

            <button
              className="close-modal"
              onClick={() => setShowCreateForm(false)}
            >
              <FiX size={22} />
            </button>


            <h2>Create New Project</h2>


            <form
              onSubmit={(e) => {
                e.preventDefault();

                setShowSuccess(true);

                setTimeout(() => {
                  setShowSuccess(false);
                  setShowCreateForm(false);
                }, 1500);

              }}
            >


              <input
                type="text"
                placeholder="Project Name"
                required
              />


              <input
                type="text"
                placeholder="Client Name"
                required
              />


              <textarea
                placeholder="Description"
              />


              <button
                type="submit"
                className="submit-create"
              >
                Create
              </button>


            </form>


          </div>

        </div>
      )}



      {/* Success Popup */}

      {showSuccess && (
        <div className="success-popup">
          Project Created Successfully 🎉
        </div>
      )}
    </div>
  );
}