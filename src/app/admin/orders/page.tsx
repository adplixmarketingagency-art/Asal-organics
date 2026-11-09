import { headers } from "next/headers";
import { requireAdmin, AdminError } from "@/lib/admin-auth";
import { AdminOrders } from "@/components/AdminOrders";
import { ShieldCheck } from "lucide-react";
import { AdminInstall } from "@/components/AdminInstall";
import { AdminLogin } from "@/components/AdminLogin";
import { ownerConfig } from "@/lib/owner-session";

export const dynamic = "force-dynamic";
export default async function OrdersPage() {
  try { await requireAdmin(new Headers(await headers())); }
  catch (error) {
    return <main className="admin-root admin-gate">
      <a className="admin-wordmark" href="/">Asal<span>OWNER DESK</span></a>
      <section className="admin-gate-card">
        <ShieldCheck size={32} strokeWidth={1.4} />
        <p className="admin-eyebrow">PRIVATE BY DESIGN</p>
        <h1>Your shop.<br />One quiet workspace.</h1>
        <p>{error instanceof AdminError ? error.message : "Owner access is temporarily unavailable."}</p>
        <p className="admin-muted">Orders and customer details are only available to authorised owners.</p>
        {ownerConfig() ? <AdminLogin /> : <p className="admin-muted">Owner sign-in needs to be configured by your site administrator.</p>}
        <a className="admin-back" href="/">Back to the storefront</a>
      </section>
      <div className="admin-gate-install"><AdminInstall /></div>
      <p className="admin-gate-foot">Asal Iyarkai Angadi · Made with care. Managed with care.</p>
    </main>;
  }
  return <AdminOrders />;
}
