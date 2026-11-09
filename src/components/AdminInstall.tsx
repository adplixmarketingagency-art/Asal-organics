"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, WifiOff } from "lucide-react";

type InstallEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Installation is a shortcut to the secure online desk, never an offline copy. */
export function AdminInstall() {
  const [installed, setInstalled] = useState(true);
  const [offline, setOffline] = useState(false);
  const [help, setHelp] = useState(false);
  const [ios, setIos] = useState(false);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const mode = window.matchMedia("(display-mode: standalone)");
    const apple = navigator as Navigator & { standalone?: boolean };
    const updateMode = () => setInstalled(mode.matches || apple.standalone === true);
    const updateNetwork = () => setOffline(!navigator.onLine);
    const ready = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const complete = () => { setInstalled(true); setPrompt(null); setHelp(false); };
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    updateMode(); updateNetwork();
    mode.addEventListener("change", updateMode);
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", complete);
    return () => {
      mode.removeEventListener("change", updateMode);
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);

  async function install() {
    if (!prompt) { setHelp((value) => !value); return; }
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch { setHelp(true); }
    finally { setPrompt(null); setBusy(false); }
  }

  return <>
    {offline && <div className="admin-message error" role="status"><WifiOff size={20} /><span>You’re offline. Reconnect and refresh before relying on order details or making changes.</span></div>}
    {!installed && <section className="admin-install" aria-label="Install owner app">
      <div className="admin-install-row">
        <span className="admin-install-icon"><Smartphone size={23} strokeWidth={1.5} /></span>
        <div><strong>Your shop, one tap away.</strong><p>Add Owner Desk to your phone’s home screen.</p></div>
        <button className="admin-button" onClick={() => void install()} disabled={busy}
          aria-expanded={help} aria-controls="owner-install-help"><Download size={16} />{prompt ? "Install app" : "Add to home screen"}</button>
      </div>
      {help && <div className="admin-install-help" id="owner-install-help">
        <p>{ios ? "Open this page in Safari. Tap Share → Add to Home Screen → Add. If shown, leave “Open as Web App” enabled."
          : "On Android, open this page in Chrome. Tap ⋮ → Add to Home screen or Install app → Install. On desktop, use the install icon in the address bar if available."}</p>
        <p>Opens straight into your private order desk. Internet and owner sign-in are required. Installing does not enable background push alerts; email alerts work when the app is closed, once configured.</p>
      </div>}
    </section>}
  </>;
}
