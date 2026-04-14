"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "matecata_install_dismissed";
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  return Date.now() - parseInt(dismissed, 10) < DISMISS_DAYS * 86400000;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [iosExpanded, setIosExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    if (isIOS()) {
      setShowIOSGuide(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-4 flex items-start gap-3 mx-4 mb-4">
      <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-yellow-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white mb-0.5">Instalar MateCata</p>
        {showIOSGuide ? (
          iosExpanded ? (
            <div className="space-y-3 mt-1">
              <div className="flex items-start gap-2">
                <span className="bg-yellow-400 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p className="text-xs text-white/70">Toca el botón <Share className="w-3.5 h-3.5 inline -mt-0.5 text-white" /> <span className="font-medium text-white">Compartir</span> en Safari</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-yellow-400 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p className="text-xs text-white/70">Busca y toca <span className="font-medium text-white">&quot;Agregar a pantalla de inicio&quot;</span></p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-yellow-400 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p className="text-xs text-white/70">Toca <span className="font-medium text-white">&quot;Agregar&quot;</span> para confirmar</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-white/70 mb-2">Agrega MateCata a tu pantalla de inicio</p>
              <button
                onClick={() => setIosExpanded(true)}
                className="bg-yellow-400 text-black text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors"
              >
                ¿Cómo?
              </button>
            </>
          )
        ) : (
          <>
            <p className="text-xs text-white/70 mb-2">Agrega MateCata a tu pantalla de inicio</p>
            <button
              onClick={handleInstall}
              className="bg-yellow-400 text-black text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors"
            >
              Instalar
            </button>
          </>
        )}
      </div>
      <button onClick={handleDismiss} className="p-1 text-white/50 hover:text-white shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
