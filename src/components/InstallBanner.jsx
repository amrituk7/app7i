import { useState, useEffect } from "react";

// Detect if running inside WhatsApp, Instagram, Facebook in-app browser
function isInAppBrowser() {
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|WhatsApp|wv/.test(ua);
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid() {
  return /android/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState(null); // "inapp" | "ios" | "android-prompt" | "android-manual"
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Already installed — don't show
    if (isStandalone()) return;
    // Already dismissed this session
    if (sessionStorage.getItem("installDismissed")) return;

    const inApp = isInAppBrowser();
    const ios = isIOS();
    const android = isAndroid();

    if (inApp) {
      setMode("inapp");
      setShow(true);
      return;
    }

    if (ios) {
      setMode("ios");
      setShow(true);
      return;
    }

    if (android) {
      // Listen for Chrome's beforeinstallprompt
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setMode("android-prompt");
        setShow(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      // If prompt never fires (already installed or not eligible), show manual
      const timer = setTimeout(() => {
        setMode((m) => m || null); // don't override if prompt fired
      }, 3000);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        clearTimeout(timer);
      };
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem("installDismissed", "1");
    setShow(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  }

  if (!show || !mode) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: "#1a1f27",
      borderTop: "1px solid rgba(196,106,45,0.35)",
      padding: "16px 20px",
      display: "flex",
      alignItems: "flex-start",
      gap: "14px",
      boxShadow: "0 -4px 24px rgba(0,0,0,0.4)"
    }}>
      <div style={{ fontSize: "24px", flexShrink: 0, marginTop: "2px" }}>
        {mode === "inapp" ? "⚠️" : "📲"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {mode === "inapp" && (
          <>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#fff8f0", marginBottom: "4px" }}>
              Open in your browser to install
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,248,240,0.7)", lineHeight: 1.5 }}>
              {isIOS()
                ? 'Tap the three dots (···) or share icon, then choose "Open in Safari". Then tap Share → Add to Home Screen.'
                : 'Tap the three dots (⋮) and choose "Open in Chrome". Then tap the install icon or menu → Add to Home Screen.'}
            </div>
          </>
        )}
        {mode === "ios" && (
          <>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#fff8f0", marginBottom: "4px" }}>
              Add App7i to your Home Screen
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,248,240,0.7)", lineHeight: 1.5 }}>
              Tap the <strong style={{ color: "#efb37a" }}>Share icon</strong> (box with arrow) at the bottom of Safari, then tap <strong style={{ color: "#efb37a" }}>Add to Home Screen</strong>.
            </div>
          </>
        )}
        {mode === "android-prompt" && (
          <>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#fff8f0", marginBottom: "8px" }}>
              Install App7i on your phone
            </div>
            <button
              onClick={handleInstall}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #c46a2d, #8f491d)",
                border: "none",
                borderRadius: "10px",
                color: "#fff8f0",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              Install app
            </button>
          </>
        )}
      </div>
      <button
        onClick={dismiss}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,248,240,0.5)",
          fontSize: "20px",
          cursor: "pointer",
          padding: "0 4px",
          flexShrink: 0
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
