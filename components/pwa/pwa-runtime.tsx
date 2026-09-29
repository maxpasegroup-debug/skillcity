"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function PwaRuntime() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  return offline ? <div role="status" className="fixed inset-x-0 top-0 z-[100] flex min-h-11 items-center justify-center gap-2 bg-brand-dark px-4 py-2 text-center text-sm font-bold text-white"><WifiOff className="h-4 w-4" />You are offline. Live actions are unavailable.</div> : null;
}

