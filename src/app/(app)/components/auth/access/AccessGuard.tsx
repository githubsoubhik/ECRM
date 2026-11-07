"use client";
// Path: src/app/components/auth/access/AccessGuard.tsx

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import type { Permission } from "./roles";
import { useAccess } from "./useAccess";

export function AccessGuard({
  permission,
  children,
  fallback,
  backHref = "/dashboard/Billing",
  backLabel = "Back to Billing",
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const { ready, can } = useAccess();
  if (!ready) return <div style={{ minHeight: "60vh" }} aria-busy="true" />;
  if (!can(permission)) return <>{fallback ?? <NoAccess backHref={backHref} backLabel={backLabel} />}</>;
  return <>{children}</>;
}

export function Can({ permission, children, fallback = null }: { permission: Permission; children: ReactNode; fallback?: ReactNode }) {
  const { can } = useAccess();
  return <>{can(permission) ? children : fallback}</>;
}

export function NoAccess({
  title = "You don't have access to this page",
  text = "This section is available to the Finance team. Ask an admin if you need access.",
  backHref = "/dashboard/Billing",
  backLabel = "Back to Billing",
}: {
  title?: string;
  text?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const router = useRouter();
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60vh", padding: 24, textAlign: "center" }}>
      <div style={{ maxWidth: 380 }}>
        <span style={{ display: "inline-grid", placeItems: "center", width: 56, height: 56, borderRadius: 16, background: "#eceefe", color: "#1f2ff2", marginBottom: 14 }}>
          <Lock size={26} />
        </span>
        <h2 style={{ margin: "0 0 6px", fontSize: 19, color: "#1e2470" }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 14, color: "#767c9b", lineHeight: 1.5 }}>{text}</p>

        <button
          type="button"
          onClick={() => router.replace(backHref)}
          style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, border: "none", background: "#1f2ff2", color: "#fff", fontWeight: 600, cursor: "pointer" }}
        >
          <ArrowLeft size={16} /> {backLabel}
        </button>
      </div>
    </div>
  );
}