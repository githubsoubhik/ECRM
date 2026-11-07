"use client";
// Path: src/app/dashboard/Clients/[id]/page.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { fetchClientDetails, type ClientDetails } from "../../../../data/clientDetailsData";
import { ClientStoreProvider, useClient } from "./components/ClientStore";
import ClientHeader from "./components/ClientHeader";
import TabViews from "./components/TabViews";
import Modals from "./components/Modals";
import s from "./ClientDetails.module.css";

interface LoadResult {
  id: string;
  data: ClientDetails | null;
  error?: string;
}

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? String(params.id) : "";
  // Only set state inside the async callbacks (never synchronously in the effect).
  // "Loading" is derived: we're loading until we have a result for the current id.
  const [result, setResult] = useState<LoadResult | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetchClientDetails(id)
      .then((data) => {
        if (alive) setResult({ id, data });
      })
      .catch(() => {
        if (alive) setResult({ id, data: null, error: "Could not load this client." });
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const loading = !result || result.id !== id;
  if (loading) return <Skeleton />;

  if (!result.data)
    return (
      <div className={s.page}>
        <div className={s.notFound}>
          <h1>{result.error ?? "Client not found"}</h1>
          <p>This client may have been removed or the link is incorrect.</p>
          <Link href="/dashboard/Clients" className={s.btnPrimary}>
            <FiArrowLeft /> Back to Clients
          </Link>
        </div>
      </div>
    );

  return (
    <ClientStoreProvider key={result.data.id} initial={result.data}>
      <Shell />
    </ClientStoreProvider>
  );
}

function Shell() {
  const { toast } = useClient();
  return (
    <div className={s.page}>
      <ClientHeader />
      <main className={s.content}>
        <TabViews />
      </main>
      <Modals />
      {toast && (
        <div className={s.toast} role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className={s.page} aria-busy="true" aria-label="Loading client">
      <div className={`${s.skel} ${s.skelHeader}`} />
      <div className={s.skelStats}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={s.skel} />
        ))}
      </div>
      <div className={s.skelGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={s.skel} />
        ))}
      </div>
    </div>
  );
}