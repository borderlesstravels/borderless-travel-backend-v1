export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <p
          style={{
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontSize: 12,
            color: "#94a3b8",
            marginBottom: 12,
          }}
        >
          Borderless Travels
        </p>
        <h1 style={{ fontSize: "2rem", margin: "0 0 12px", fontWeight: 600 }}>
          API is online
        </h1>
        <p style={{ color: "#94a3b8", lineHeight: 1.6, margin: "0 0 24px" }}>
          This Next.js service hosts the Borderless backend. Client apps should
          call routes under <code>/api/v1</code>.
        </p>
        <a
          href="/api/health"
          style={{
            display: "inline-block",
            padding: "10px 18px",
            borderRadius: 8,
            background: "#38bdf8",
            color: "#0f172a",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Check health
        </a>
      </div>
    </main>
  );
}
