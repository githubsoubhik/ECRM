// Path: src/app/components/auth/access/roles.ts
// ─────────────────────────────────────────────────────────────
// Role based access – ONE place to decide who can see / do what.
// Use the same permissions on every dashboard page:
//   <AccessGuard permission="billing.view"> … </AccessGuard>
//   const { can } = useAccess();  can("billing.create")
// ─────────────────────────────────────────────────────────────

export type Role = "admin" | "finance" | "manager" | "sales" | "employee";

export const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "finance", label: "Finance Team" },
  { value: "manager", label: "Manager" },
  { value: "sales", label: "Sales" },
  { value: "employee", label: "Employee" },
];

/** Add new permissions here as you build more pages (e.g. "leads.view") */
export type Permission =
  | "billing.view" // open the Billing & Invoicing page
  | "billing.create" // invoices, subscriptions, payments
  | "billing.edit" // mark paid, renew, cancel
  | "billing.delete"
  | "billing.export" // reports, print / download
  | "billing.settings"
  | "quotations.create"
  | "clients.create"
  | "products.manage"
  | "expenses.manage";

const ALL = "*" as const;

export const ROLE_PERMISSIONS: Record<Role, Permission[] | typeof ALL> = {
  admin: ALL,
  finance: [
    "billing.view",
    "billing.create",
    "billing.edit",
    "billing.delete",
    "billing.export",
    "billing.settings",
    "quotations.create",
    "clients.create",
    "products.manage",
    "expenses.manage",
  ],
  manager: ["billing.view", "billing.export", "quotations.create"],
  sales: ["billing.view", "quotations.create", "clients.create"],
  employee: ["billing.view"],
};

export function roleCan(role: Role, permission: Permission) {
  const list = ROLE_PERMISSIONS[role];
  return list === ALL || list.includes(permission);
}
