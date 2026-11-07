"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { INITIAL_CLIENTS, type Client } from "../../../data/clientsData";
import {
  FiUsers,
  FiBriefcase,
  FiUserPlus,
  FiUserX,
  FiSearch,
  FiDownload,
  FiPlus,
  FiMoreHorizontal,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiTrash2,
  FiChevronDown
} from "react-icons/fi";

export default function ClientsPage() {
  const router = useRouter();
  const openClient = (id: string) => router.push(`/dashboard/Clients/${id}`);

  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [activeTab, setActiveTab] = useState<string>("All Clients");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5); // default set to 5 to demonstrate pagination with 10 items

  // Action Menu Popover State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Helper: Get Initials for Avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Helper: Get Avatar background color based on name
  const getBgColor = (name: string) => {
    const colors = ["#fde68a", "#fed7aa", "#fbcfe8", "#c7d2fe", "#a7f3d0", "#bae6fd"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Filter Logic
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Tab Filtering
      const matchesTab =
        activeTab === "All Clients" ||
        (activeTab === "Active" && client.status === "Active") ||
        (activeTab === "Inactive" && client.status === "Inactive") ||
        (activeTab === "Prospects" && client.status === "Prospect");

      // Search Filtering
      const matchesSearch =
        client.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [clients, activeTab, searchQuery]);

  // Pagination Calculation
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  // Checkbox Select Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedClients.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Action Menu Handlers
  const handleApprove = (id: string) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "Active" } : c))
    );
    setOpenMenuId(null);
  };

  const handleDelete = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    setOpenMenuId(null);
  };

  return (
    <div className="clients-page-container">
      {/* Top Breadcrumb & Page Header */}
      <div className="page-header">
        <div className="header-text">
          <div className="breadcrumb">
            Dashboard &gt; <span>Clients</span>
          </div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">
            Manage your clients, view details, track projects and stay connected.
          </p>
        </div>

        <button className="add-client-btn">
          <FiPlus className="icon" /> Add Client <FiChevronDown className="chevron" />
        </button>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon icon-orange">
            <FiUsers />
          </div>
          <div className="stat-info">
            <div className="stat-number">12</div>
            <div className="stat-label">Total Clients</div>
            <div className="stat-trend trend-up">
              ↑ 20% <span className="trend-period">vs last month</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-blue">
            <FiBriefcase />
          </div>
          <div className="stat-info">
            <div className="stat-number">8</div>
            <div className="stat-label">Active Clients</div>
            <div className="stat-trend trend-up">
              ↑ 14% <span className="trend-period">vs last month</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-red">
            <FiUserPlus />
          </div>
          <div className="stat-info">
            <div className="stat-number">2</div>
            <div className="stat-label">New Clients</div>
            <div className="stat-trend trend-up">
              ↑ 100% <span className="trend-period">vs last month</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-green">
            <FiUserX />
          </div>
          <div className="stat-info">
            <div className="stat-number">2</div>
            <div className="stat-label">Inactive Clients</div>
            <div className="stat-trend trend-down">
              ↓ 33% <span className="trend-period">vs last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Filters, Search, Table */}
      <div className="table-card">
        {/* Navigation Tabs and Search/Filter Bar */}
        <div className="filter-toolbar">
          <div className="tabs-list">
            {["All Clients", "Active", "Inactive", "Prospects"].map((tab) => (
              <button
                key={tab}
                className={`tab-item ${activeTab === tab ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="toolbar-actions">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search clients by name, email or company..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="select-dropdown">
              <select defaultValue="All Industries">
                <option>All Industries</option>
              </select>
            </div>

            <div className="select-dropdown">
              <select defaultValue="All Status">
                <option>All Status</option>
              </select>
            </div>

            <button className="export-btn">
              <FiDownload /> Export <FiChevronDown />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="clients-table">
            <thead>
              <tr>
                <th className="col-checkbox">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedClients.length > 0 &&
                      selectedIds.length === paginatedClients.length
                    }
                  />
                </th>
                <th>Client Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Projects</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Joined On</th>
                <th className="col-action">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.length > 0 ? (
                paginatedClients.map((client) => {
                  const isSelected = selectedIds.includes(client.id);
                  return (
                    <tr
                      key={client.id}
                      className={isSelected ? "selected-row" : ""}
                      onClick={() => openClient(client.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") openClient(client.id);
                      }}
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                      title={`Open ${client.clientName}`}
                    >
                      <td className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(client.id)}
                        />
                      </td>

                      {/* Client Name with Avatar */}
                      <td className="col-client">
                        <div className="client-identity">
                          {client.avatar ? (
                            <img
                              src={client.avatar}
                              alt={client.clientName}
                              className="client-avatar"
                            />
                          ) : (
                            <div
                              className="client-avatar-fallback"
                              style={{ backgroundColor: getBgColor(client.clientName) }}
                            >
                              {getInitials(client.clientName)}
                            </div>
                          )}
                          <span className="client-name">{client.clientName}</span>
                        </div>
                      </td>

                      {/* Company & Industry */}
                      <td>
                        <div className="company-info">
                          <span className="company-name">{client.company}</span>
                          {client.industry && (
                            <span className="company-industry">{client.industry}</span>
                          )}
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="cell-text">{client.email}</td>
                      <td className="cell-text">{client.phone}</td>
                      <td className="cell-center">{client.projects}</td>
                      <td className="cell-text font-semibold">{client.totalSpent}</td>

                      {/* Status Badge */}
                      <td>
                        <span
                          className={`status-badge ${client.status === "Active"
                              ? "badge-active"
                              : client.status === "Inactive"
                                ? "badge-inactive"
                                : "badge-prospect"
                            }`}
                        >
                          <span className="badge-dot" />
                          {client.status}
                        </span>
                      </td>

                      <td className="cell-text">{client.joinedOn}</td>

                      {/* Actions Menu */}
                      <td className="col-action" onClick={(e) => e.stopPropagation()}>
                        <div className="action-popover-container">
                          <button
                            className="action-menu-btn"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === client.id ? null : client.id
                              )
                            }
                          >
                            <FiMoreHorizontal />
                          </button>

                          {/* Popover Menu displaying Approve and Delete */}
                          {openMenuId === client.id && (
                            <div className="action-popover-menu">
                              <button
                                className="popover-item approve-item"
                                onClick={() => handleApprove(client.id)}
                              >
                                <FiCheckCircle /> Approve
                              </button>
                              <button
                                className="popover-item delete-item"
                                onClick={() => handleDelete(client.id)}
                              >
                                <FiTrash2 /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="no-data">
                    No clients found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination Controls */}
        <div className="pagination-footer">
          <div className="showing-results">
            Showing{" "}
            {filteredClients.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}
            -
            {Math.min(currentPage * itemsPerPage, filteredClients.length)} of{" "}
            {filteredClients.length} clients
          </div>

          <div className="pagination-controls">
            {/* Prev Page Button */}
            <button
              className="page-nav-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <FiChevronLeft />
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`page-num-btn ${currentPage === page ? "active" : ""
                  }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            {/* Next Page Button */}
            <button
              className="page-nav-btn"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
            >
              <FiChevronRight />
            </button>

            {/* Items Per Page Selector */}
            <div className="items-per-page">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
