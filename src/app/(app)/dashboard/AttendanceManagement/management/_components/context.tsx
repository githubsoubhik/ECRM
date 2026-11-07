"use client";

// Shared state for every Attendance Management view.

import { createContext, useContext } from "react";
import type { TeamMember } from "../../../../../data/employeeData";
import type { AttContext, AttStatus, DayRecord } from "../../../../../data/attendanceData";

export type ViewKey = "daily" | "monthly" | "calendar" | "employee" | "reports";

export const VIEWS: { key: ViewKey; label: string; short: string }[] = [
  { key: "daily", label: "Daily View", short: "Daily" },
  { key: "monthly", label: "Monthly View", short: "Monthly" },
  { key: "calendar", label: "Calendar View", short: "Calendar" },
  { key: "employee", label: "Employee View", short: "Employee" },
  { key: "reports", label: "Reports", short: "Reports" },
];

export interface Member extends TeamMember {
  employmentType: string;
}

export interface Filters {
  dept: string;
  type: string;
  status: string; // AttStatus or ""
  q: string;
}

export const EMPTY_FILTERS: Filters = { dept: "", type: "", status: "", q: "" };

export interface AttApi {
  employees: Member[];
  ctx: AttContext;
  /** Records for every employee on a date (same order as `employees`). Cached. */
  day: (date: string) => DayRecord[];
  record: (employeeId: string, date: string) => DayRecord;

  date: string; // selected date YYYY-MM-DD
  setDate: (date: string) => void;
  year: number;
  month: number; // 0-11
  setMonth: (year: number, month: number) => void;

  view: ViewKey;
  setView: (v: ViewKey) => void;
  isMobile: boolean;

  filters: Filters;
  setFilters: (f: Filters) => void;
  departments: string[];
  /** Applies department / type / search filters (and status against `date` when given). */
  applyFilters: (list: Member[], f?: Filters, statusDate?: string) => Member[];

  selectedEmp: string | null;
  setSelectedEmp: (id: string | null) => void;

  openMark: (opts?: { ids?: string[]; date?: string }) => void;
  /** One-click status change (row menus, bulk bar). */
  quickMark: (ids: string[], date: string, status: AttStatus) => void;
  /** Removes a manual change so the automatic record shows again. */
  resetRecord: (id: string, date: string) => void;
  openImport: () => void;
  openSettings: () => void;
  openProfile: (id: string) => void;
  exportMonth: () => void;
  notify: (text: string) => void;
  refresh: () => void;
}

export const AttendanceCtx = createContext<AttApi | null>(null);

export function useAtt(): AttApi {
  const api = useContext(AttendanceCtx);
  if (!api) throw new Error("useAtt must be used inside the Attendance page");
  return api;
}

export const isAttStatus = (s: string): s is AttStatus => ["present", "late", "half-day", "leave", "absent", "weekly-off", "holiday"].includes(s);