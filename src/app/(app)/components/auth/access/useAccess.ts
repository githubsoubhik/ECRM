"use client";
// Path: src/app/components/auth/access/useAccess.ts
// Current user's role + can(). Works without any provider.
//
// TODO when login is ready: replace getRole() with the role from your
// session / JWT / user API (e.g. user.role) and remove setRole.

import { useCallback, useSyncExternalStore } from "react";
import { ROLES, roleCan, type Permission, type Role } from "./roles";

const KEY = "pavion-role";
const DEFAULT_ROLE: Role = "admin";
const listeners = new Set<() => void>();

function getRole(): Role {
  try {
    const r = window.localStorage.getItem(KEY) as Role | null;
    return r && ROLES.some((x) => x.value === r) ? r : DEFAULT_ROLE;
  } catch {
    return DEFAULT_ROLE;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Demo / testing only – switch the role from the UI */
export function setRole(role: Role) {
  try {
    window.localStorage.setItem(KEY, role);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useAccess() {
  // null on the server → pages render a loading state, never a wrong "no access" flash
  const role = useSyncExternalStore<Role | null>(subscribe, getRole, () => null);
  const can = useCallback((p: Permission) => (role ? roleCan(role, p) : false), [role]);
  return { role, ready: role !== null, can, setRole };
}
