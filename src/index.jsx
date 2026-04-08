import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Apply dark mode before render
if (localStorage.getItem("rmDark") === "1") {
  document.body.classList.add("dark");
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Keep local development free from stale cached assets.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

    if (isLocalhost) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {});
        });
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
