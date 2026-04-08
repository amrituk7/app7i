import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "32px",
          fontFamily: "system-ui, sans-serif",
          background: "#0f172a",
          color: "#f1f5f9",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "48px" }}>⚠️</div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ margin: 0, color: "#94a3b8", maxWidth: "400px", lineHeight: 1.6 }}>
            The app hit an unexpected error. Please refresh the page. If this keeps happening, contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "8px",
              padding: "12px 24px",
              background: "#1d4ed8",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            Refresh page
          </button>
          <details style={{ marginTop: "8px", color: "#475569", fontSize: "12px", maxWidth: "500px" }}>
            <summary style={{ cursor: "pointer" }}>Error details</summary>
            <pre style={{ marginTop: "8px", whiteSpace: "pre-wrap", textAlign: "left" }}>
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
