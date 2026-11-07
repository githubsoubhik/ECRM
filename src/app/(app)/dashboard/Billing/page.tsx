// Path: src/app/dashboard/Billing/page.tsx
// URL: /dashboard/Billing
// Finance-team page – protected with role based access (see src/app/components/auth/access/roles.ts)

"use client";

import { AccessGuard } from "../../components/auth/access/AccessGuard";
import BillingDashboard from "./components/BillingDashboard";
import { BillingProvider } from "./components/BillingStore";

export default function BillingPage() {
  return (
   <AccessGuard permission="billing.view" backHref="/dashboard/Billing" backLabel="Back to Billing">
      <BillingProvider>
        <BillingDashboard />
      </BillingProvider>
    </AccessGuard>
  );
}
