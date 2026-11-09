"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Bell, Check, ChevronRight, Inbox, LogOut, Mail, Package, RefreshCw, Search, ShieldCheck, Truck } from "lucide-react";
import { fulfillmentStatuses, type AdminOrderDetail, type OrderFilter, type OrdersResult } from "@/lib/admin-types";
import { AdminInstall } from "./AdminInstall";

type Snapshot = OrdersResult & { owner: string; notification: { emailConfigured: boolean; processorConfigured: boolean } };
const labels: Record<string, string> = { all: "All orders", paid: "Paid", pending: "Awaiting payment", unfulfilled: "To pack", packed: "Packed", shipped: "Shipped", delivered: "Delivered", retry: "Retry queued", processing: "Sending", sent: "Provider accepted", failed: "Needs attention", needs_review: "Check provider" };
const notificationLabel = (status: string) => status === "pending" ? "Queued" : labels[status] ?? status;
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value / 100);
const date = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(path, { method, cache: "no-store", credentials: "same-origin",
    headers: method === "GET" ? {} : { "Content-Type": "application/json", "X-Asal-Admin": "1" },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  if (response.redirected || !response.headers.get("content-type")?.includes("application/json")) {
    throw new ApiError("Your session may have expired. Reload to sign in.", 401);
  }
  const result = await response.json();
  if (!response.ok) throw new ApiError(result.error ?? "Unable to load orders.", response.status);
  return result;
}
function Badge({ status, notification = false }: { status: string; notification?: boolean }) {
  return <span className={`admin-badge ${status}`}>{notification ? notificationLabel(status) : labels[status] ?? status}</span>;
}

export function AdminOrders() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [alerts, setAlerts] = useState(false);
  const [lastRefresh, setLastRefresh] = useState("");
  const previousPaid = useRef<number | null>(null);
  const listVersion = useRef(0);
  const detailVersion = useRef(0);
  const alertsRef = useRef(false);
  const authExpired = useRef(false);
  const selectedId = useRef<string | null>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);

  const handleError = useCallback((cause: unknown) => {
    setError(cause instanceof Error ? cause.message : "Couldn't load orders. Try refreshing.");
    if (cause instanceof ApiError && [401, 403].includes(cause.status)) {
      // Invalidate concurrent responses too; a late success must not restore PII.
      authExpired.current = true;
      listVersion.current++; detailVersion.current++;
      setSnapshot(null); setDetail(null); setDetailId(null); setLoading(false);
    }
  }, []);
  const load = useCallback(async () => {
    if (authExpired.current) return;
    const version = ++listVersion.current;
    setLoading(true);
    try {
      const data = await api<Snapshot>(`/api/admin/orders?${new URLSearchParams({ status: filter, page: String(page), q: search })}`);
      if (version !== listVersion.current) return;
      if (previousPaid.current !== null && data.summary.paid > previousPaid.current) {
        const count = data.summary.paid - previousPaid.current;
        setNotice(`${count} new paid ${count === 1 ? "order" : "orders"} received. Check the order inbox.`);
        if (alertsRef.current && "Notification" in window && Notification.permission === "granted") {
          try { new Notification("Asal · New paid order", { body: "Your order inbox has new orders.", tag: "asal-new-orders" }); } catch { /* In-page alert remains available on unsupported mobile browsers. */ }
        }
      }
      previousPaid.current = data.summary.paid;
      setSnapshot(data); setError(""); setLastRefresh(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    } catch (cause) { if (version === listVersion.current) handleError(cause); }
    finally { if (version === listVersion.current) setLoading(false); }
  }, [filter, page, search, handleError]);

  const loadDetail = useCallback(async (id: string, focus = false) => {
    if (authExpired.current || selectedId.current !== id) return;
    const version = ++detailVersion.current;
    try {
      const data = await api<{ order: AdminOrderDetail }>(`/api/admin/orders/${id}`);
      if (version !== detailVersion.current) return;
      setDetail(data.order); setDetailError("");
      if (focus) window.requestAnimationFrame(() => detailHeading.current?.focus());
    } catch (cause) {
      if (version !== detailVersion.current) return;
      setDetailError(cause instanceof Error ? cause.message : "Couldn't load this order.");
      if (cause instanceof ApiError && [401, 403].includes(cause.status)) handleError(cause);
    }
  }, [handleError]);
  useEffect(() => { void load(); return () => { listVersion.current++; }; }, [load]);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("order");
    if (id && /^[0-9a-f-]{36}$/i.test(id)) setDetailId(id);
  }, []);
  useEffect(() => {
    selectedId.current = detailId;
    setDetail(null); setDetailError(""); setConfirmStatus(null);
    if (detailId) void loadDetail(detailId, true);
    return () => { detailVersion.current++; selectedId.current = null; };
  }, [detailId, loadDetail]);
  useEffect(() => {
    const refresh = () => { if (!document.hidden) { void load(); if (detailId) void loadDetail(detailId); } };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [load, detailId, loadDetail]);

  async function toggleAlerts() {
    if (alerts) { setAlerts(false); alertsRef.current = false; return; }
    if (!("Notification" in window)) { setNotice("This browser doesn't support desktop alerts. New orders will still appear here."); return; }
    try {
      const permission = await Notification.requestPermission();
      const enabled = permission === "granted";
      setAlerts(enabled); alertsRef.current = enabled;
      setNotice(enabled ? "Browser alerts enabled while this dashboard is open." : "Browser alerts are blocked. You can allow them in your browser's site settings.");
    } catch { setNotice("Browser alerts are unavailable. Keep the dashboard open for in-page updates."); }
  }
  async function action(path: string, method: string, body: unknown, message: string) {
    setBusy(true); setError("");
    try {
      await api(path, method, body);
      setNotice(message);
      await load();
      if (selectedId.current) await loadDetail(selectedId.current);
    } catch (cause) { handleError(cause); }
    finally { setBusy(false); setConfirmStatus(null); }
  }
  async function signOut() {
    setBusy(true);
    try {
      await api("/api/admin/logout", "POST", {});
      authExpired.current = true;
      listVersion.current++; detailVersion.current++;
      setSnapshot(null); setDetail(null);
      window.location.replace("/admin/orders");
    } catch (cause) { handleError(cause); setBusy(false); }
  }
  function selectOrder(id: string | null) {
    if (selectedId.current === id) {
      if (id) void loadDetail(id, true);
      return;
    }
    detailVersion.current++;
    selectedId.current = id;
    setDetail(null);
    setDetailId(id);
    window.history.replaceState(null, "", id ? `?order=${id}` : window.location.pathname);
  }
  const nextStatus = detail ? fulfillmentStatuses[fulfillmentStatuses.indexOf(detail.fulfillmentStatus) + 1] : undefined;
  const notification = detail?.notification;
  const canRetry = notification && ["failed", "retry"].includes(notification.status) && notification.firstAttemptAt &&
    Date.now() - new Date(notification.firstAttemptAt).getTime() < 22 * 3600 * 1000;

  return <div className="admin-root">
    <a href="#order-inbox" className="skip-link">Skip to orders</a>
    <header className="admin-topbar">
      <a className="admin-wordmark" href="/admin/orders">Asal<span>OWNER DESK</span></a>
      <div className="admin-top-links"><span><ShieldCheck size={15} /> Private workspace</span><a href="/" target="_blank" rel="noreferrer">View store <ArrowUpRight size={15} /></a><button className="admin-button" disabled={busy} onClick={signOut} aria-label="Sign out"><LogOut size={18} /></button></div>
    </header>
    <main className="admin-workspace" id="order-inbox">
      <div className="admin-title-row">
        <div><p className="admin-eyebrow">THE DAILY DESK</p><h1>Every order, cared for.</h1><p className="admin-muted">From the first payment to the doorstep.</p></div>
        <div className="admin-actions"><button className={`admin-button ${alerts ? "primary" : ""}`} onClick={toggleAlerts}><Bell size={17} /> {alerts ? "Alerts on" : "Enable alerts"}</button><button className="admin-button" onClick={() => { void load(); if (detailId) void loadDetail(detailId); }} disabled={loading || busy}><RefreshCw size={17} /> Refresh</button></div>
      </div>
      <AdminInstall />
      {error && <div className="admin-message error" role="alert">{error} <button onClick={() => window.location.reload()}>Reload workspace</button></div>}
      {notice && <div className="admin-message" role="status"><Bell size={17} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notification">Dismiss</button></div>}
      <div className="admin-stats">
        {([["Paid orders", snapshot?.summary.paid, <Inbox key="inbox" />], ["Ready to pack", snapshot?.summary.unfulfilled, <Package key="package" />], ["On the way", snapshot?.summary.shipped, <Truck key="truck" />], ["Email issues", snapshot?.summary.notificationIssues, <Mail key="mail" />]] as const).map(([title, count, icon]) =>
          <div className="admin-stat" key={title}><div>{title}{icon}</div><strong>{count ?? "—"}</strong></div>)}
      </div>
      <section className="admin-notifications" aria-label="Notification delivery">
        <Mail size={21} /><div><strong>Owner email notifications</strong><p>{snapshot?.notification.emailConfigured
          ? "Paid-order alerts are configured. “Provider accepted” is not confirmation of inbox delivery."
          : "Not connected yet. Configure the sender, owner email and email API key to receive alerts."}
          {snapshot && !snapshot.notification.processorConfigured ? " The scheduled processor also needs its secret." : ""}
        </p><p>Browser alerts work while this page is open. Email processing runs every 5 minutes once configured.</p></div>
        <button className="admin-button" disabled={busy || !snapshot?.notification.emailConfigured} onClick={() => action("/api/admin/notifications/process", "POST", {}, "Notification queue processed. Check each order for its delivery status.")}>Process queue <ArrowRight size={16} /></button>
      </section>
      <div className={`admin-content ${detailId ? "with-detail" : ""}`}>
        <section className="admin-inbox" aria-label="Order inbox">
          <div className="admin-inbox-heading"><h2>Order inbox <span>{snapshot?.total ?? "—"}</span></h2><span className="admin-small">{loading ? "Updating…" : lastRefresh ? `Updated ${lastRefresh}` : "Awaiting connection"}</span></div>
          <div className="admin-tools">
            <label className="admin-filter"><span className="sr-only">Order status</span><select value={filter} onChange={(e) => { setFilter(e.target.value as OrderFilter); setPage(1); }}>{["all", "unfulfilled", "packed", "shipped", "delivered", "paid", "pending"].map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></label>
            <form className="admin-search" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}><Search size={17} /><label className="sr-only" htmlFor="order-search">Search receipt or customer name</label><input id="order-search" type="search" maxLength={100} placeholder="Receipt or customer name" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} /><button type="submit">Search</button></form>
          </div>
          <div className="admin-table-wrap" aria-busy={loading}>
            <table className="admin-table"><thead><tr><th scope="col">Order / customer</th><th scope="col">Total</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead>
              <tbody>{snapshot?.orders.map((order) => <tr key={order.id} className={detailId === order.id ? "selected" : ""}>
                <td><button className="admin-order-link" onClick={() => selectOrder(order.id)} aria-expanded={detailId === order.id}>{order.receipt}</button><p>{order.customerName} <span>· {order.city}</span></p><small>{date(order.createdAt)}</small></td>
                <td className="admin-total">{money(order.amountPaise)}</td><td><Badge status={order.status === "paid" ? order.fulfillmentStatus : "pending"} /><small className="admin-email-status">Email: {order.notificationStatus ? notificationLabel(order.notificationStatus) : "Not queued"}</small></td>
                <td><button className="admin-open" onClick={() => selectOrder(order.id)} aria-label={`View order ${order.receipt}`}><ChevronRight size={18} /></button></td>
              </tr>)}</tbody></table>
            {(!snapshot || !snapshot.orders.length) && <div className="admin-empty"><Inbox size={34} strokeWidth={1.2} /><h3>{loading ? "Loading your orders…" : error ? "Orders are unavailable" : search || filter !== "all" ? "No matching orders" : "A little quiet, for now."}</h3><p>{error ? "Your data hasn't been loaded. Fix the connection and refresh." : "Verified live orders will appear here. Sandbox payments aren't saved or fulfilled."}</p></div>}
          </div>
          <div className="admin-pagination"><span>Page {page} · {snapshot?.total ?? 0} orders</span><div><button disabled={page === 1 || loading} onClick={() => setPage(page - 1)} aria-label="Previous page"><ArrowLeft size={17} /></button><button disabled={!snapshot || page * 20 >= snapshot.total || loading} onClick={() => setPage(page + 1)} aria-label="Next page"><ArrowRight size={17} /></button></div></div>
        </section>
        {detailId && <aside className="admin-detail" aria-label="Order details">
          <div className="admin-detail-title"><p className="admin-eyebrow">ORDER DETAILS</p><button className="admin-button" onClick={() => selectOrder(null)}>Close</button></div>
          {detailError && <p className="admin-message error" role="alert">{detailError}</p>}
          {!detail ? <p className="admin-muted">{detailError ? "Please retry by opening the order again." : "Opening order…"}</p> : <>
            <h2 ref={detailHeading} tabIndex={-1}>{detail.receipt}</h2><p className="admin-small">{date(detail.createdAt)} IST</p>
            <div className="admin-detail-badges"><Badge status={detail.status} />{detail.status === "paid" && <Badge status={detail.fulfillmentStatus} />}</div>
            <section><h3>In the parcel</h3>{detail.items.map((item, i) => <div className="admin-line" key={`${item.productId}-${i}`}><div><strong>{item.name}</strong><p>{item.size ?? "Standard pack"} · Qty {item.quantity}</p></div><span>{money(item.quantity * item.unitPricePaise)}</span></div>)}<div className="admin-line total"><strong>Order total</strong><strong>{money(detail.amountPaise)}</strong></div></section>
            <section><h3>Deliver to</h3><address><strong>{detail.customer.fullName}</strong><br />{detail.customer.address}<br />{detail.customer.apartment && <>{detail.customer.apartment}<br /></>}{detail.customer.city}, {detail.customer.state} {detail.customer.pincode}<br />India</address><p className="admin-contact">{detail.customer.phone}<br />{detail.customer.email}</p></section>
            <section><h3>Fulfilment</h3><p className="admin-muted">{detail.status !== "paid" ? "Awaiting verified payment. Do not fulfil this order." : nextStatus ? "Confirm the parcel is ready before moving it forward." : "This order has been delivered."}</p>{detail.status === "paid" && nextStatus && (confirmStatus === nextStatus ? <div className="admin-confirm" role="group" aria-label="Confirm fulfilment change">
              <p className="admin-muted">Mark {detail.receipt} as {nextStatus}? This change is recorded in the activity log.</p>
              <button className="admin-button primary" disabled={busy} onClick={() => void action(`/api/admin/orders/${detail.id}`, "PATCH", { from: detail.fulfillmentStatus, to: nextStatus }, `Order marked ${nextStatus}.`)}><Check size={17} /> Confirm {nextStatus}</button>{" "}
              <button className="admin-button" disabled={busy} onClick={() => setConfirmStatus(null)}>Cancel</button>
            </div> : <button className="admin-button primary" disabled={busy} onClick={() => setConfirmStatus(nextStatus)}><Check size={17} /> Mark as {nextStatus}</button>)}</section>
            <section><h3>Owner notification</h3>{notification ? <><Badge status={notification.status} notification /><p className="admin-small">{notification.attempts} delivery attempts{notification.sentAt ? ` · Accepted ${date(notification.sentAt)}` : ""}</p>{notification.lastError && <p className="admin-muted">{notification.lastError}</p>}{canRetry && <button className="admin-button" disabled={busy || !snapshot?.notification.emailConfigured} onClick={() => action(`/api/admin/orders/${detail.id}/retry`, "POST", {}, "Email retry queued for the next scheduled run.")}>Queue safe retry <RefreshCw size={15} /></button>}</> : <p className="admin-muted">Queued only after a verified payment.</p>}</section>
            <section><h3>Payment references</h3><dl className="admin-references"><dt>Razorpay order</dt><dd>{detail.razorpayOrderId ?? "Not attached"}</dd><dt>Payment</dt><dd>{detail.paymentId ?? "Not captured"}</dd></dl></section>
            {!!detail.history.length && <section><h3>Activity</h3><ul className="admin-history">{detail.history.map((event) => <li key={event.id}><strong>{labels[event.toStatus]}</strong><span>{date(event.createdAt)} · {event.actor}</span></li>)}</ul></section>}
          </>}
        </aside>}
      </div>
      <footer className="admin-footer"><span>Asal Iyarkai Angadi · Owner desk</span><span>Private customer information · All times IST</span></footer>
    </main>
  </div>;
}
