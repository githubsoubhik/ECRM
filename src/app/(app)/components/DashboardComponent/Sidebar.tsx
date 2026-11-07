"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { canAccess, roleRoutes } from "../../../../../lib/roles";



export default function Sidebar({role}:{role: string}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Prevent background scrolling while mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // console.log("ROLE...>:", role, "| keys:", Object.keys(roleRoutes));


  // console.log("canAccess", canAccess);

  // console.log("roleroute", roleRoutes);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
    },
    {
      name: "Clients",
      path: "/dashboard/Clients",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
    {
      name: "Projects",
      path: "/dashboard/projects",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
    },
    {
      name: "Tasks",
      path: "/dashboard/Tasks",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      ),
    },

    {
      name: "Task Management",
      path: "/dashboard/TaskManagement",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">

          {/* Clipboard */}
          <path d="M7 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5M17 3h2a2 2 0 0 1 2 2v1" />

          {/* Top Clip */}
          <rect x="7" y="1.5" width="10" height="5" rx="2" />

          {/* Check */}
          <path d="m7 14 3 3 7-8" />

          {/* Right Dots/Lines */}
          <path d="M21 10v.01M21 13v2M21 17v2" />
        </svg>
      ),
    },

    {
      name: "Client Onboarding Form",
      path: "/dashboard/ClientOnboardingForm",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      ),
    },

    {
      name: "Team",
      path: "/dashboard/Team",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
    {
      name: "Leads",
      path: "/dashboard/leads",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M16.2 7.8l-2 5.6-5.6 2 2-5.6z"></path>
        </svg>
      ),
    },
    {
      name: "Finance",
      path: "/dashboard/Finance",
      isDisabled: true,
      subItems: ["Invoices", "Expenses", "Payroll", "Transactions"],
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      ),
    },
    {
      name: "Billing",
      path: "/dashboard/Billing",
      subItems: ["Invoices", "Expenses", "Payroll", "Transactions"],
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2h10l4 4v16H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
          <path d="M16 2v5h5" />
          <line x1="8" y1="10" x2="17" y2="10" />
          <line x1="8" y1="13" x2="17" y2="13" />
          <line x1="8" y1="16" x2="17" y2="16" />
          <circle cx="13" cy="19" r="3" />
          <path d="M13 17.5v3M14.2 18.2c-.3-.3-.7-.4-1.2-.4-.6 0-1 .3-1 .7s.4.6 1 .7 1 .3 1 .7-.4.7-1 .7c-.5 0-.9-.2-1.2-.5" />
        </svg>
      )

    },
    {
      name: "Reports",
      path: "/dashboard/reports",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
          <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
        </svg>
      ),
    },
    {
      name: "Announcement Manage",
      path: "/dashboard/AnnouncementManagement",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9v6h4l3 6h2l-2-6h2l7 4V5l-7 4H3z" fill="currentColor" stroke="none"></path>
          <path d="M21 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
        </svg>

      ),
    },
    {
      name: "Announcements",
      path: "/dashboard/Announcements",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 7.5h2.5L18 2v20L4.5 17H2z"></path>
          <path d="M4 8v9"></path>
          <path d="M7 17l2 5c.3.8 1.2 1.2 2 .9.8-.3 1.2-1.2.9-2L10.5 17"></path>
          <path d="M20 7l2-1.2"></path>
          <path d="M20 12h2"></path>
          <path d="M20 17l2 1.2"></path>
        </svg>
      ),
    },
    {
      name: "Messages",
      path: "/dashboard/Messages",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
    },
    {
      name: "Calendar",
      path: "/dashboard/Calendar",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
    },
    {
      name: "Attendance",
      path: "/dashboard/Attendance",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
    },
    {
      name: "AttendanceManagement",
      path: "/dashboard/AttendanceManagement/management",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">

          {/* Calendar */}
          <path d="M3 5h18v16H3zM3 9h18M7 3v4M12 3v4M17 3v4" />

          {/* Checkboxes */}
          <rect x="6" y="11" width="2" height="2" rx=".2" />
          <rect x="10" y="11" width="2" height="2" rx=".2" />
          <rect x="6" y="15" width="2" height="2" rx=".2" />
          <path d="m10.4 16  .5.5 1-1" />

          {/* Check Badge */}
          <circle cx="18" cy="18" r="3.5" />
          <path d="m16.8 18  .8.8 1.5-1.6" />
        </svg>
      ),
    },
    {
      name: "Settings",
      path: "/dashboard/settings",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
    },
  ];


 const visibleItems = menuItems.filter((item) => canAccess(role, item.path));

 //console.log("visibilities--->", visibleItems);


  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Navigation Menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>

      {/* Background Shadow Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Main Sidebar Element */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Brand / Logo Area */}
        <div className="logo-container">
          <Image
            src="/logo (2).png"
            alt="Company Logo"
            width={130}
            height={32}
            priority
            className="company-logo"
          />
        </div>

        {/* Navigation Links */}
        <nav className="menu-nav">
          <ul className="menu">
            {visibleItems.map((item) => {
              const isActive = pathname === item.path;

              if (item.isDisabled) {
                return (
                  <li key={item.path} className="menu-item-has-submenu">
                    <div
                      className="menu-link disabled"
                      onClick={(e) => e.preventDefault()}
                    >
                      <span className="menu-icon">{item.icon}</span>
                      <span className="menu-text">{item.name}</span>
                      <span className="badge-coming-soon">Coming Soon</span>
                    </div>
                  </li>
                );
              }

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`menu-link ${isActive ? "active" : ""}`}
                    prefetch={true}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    <span className="menu-text">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Support Widget */}
        <div className="sidebar-footer">
          <Link
            href="/dashboard/support"
            className="support-card"
            onClick={() => setIsOpen(false)}
          >
            <div className="support-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
              </svg>
            </div>
            <div className="support-info">
              <span className="support-title">Need Help?</span>
              <span className="support-subtitle">Contact support</span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}