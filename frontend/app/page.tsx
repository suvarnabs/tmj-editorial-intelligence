const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const healthUrl = `${apiUrl}/health`;

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: "640px",
        margin: "0 auto",
        padding: "4rem 1.5rem",
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 600,
          marginBottom: "0.75rem",
          letterSpacing: "-0.02em",
        }}
      >
        TMJ Editorial Intelligence
      </h1>

      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Internal newsroom intelligence platform for The Malabar Journal.
        Milestone 1: local development starter.
      </p>

      <section
        style={{
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "1.25rem 1.5rem",
          background: "#fff",
        }}
      >
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Backend health check
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginBottom: "1rem" }}>
          When the backend is running and connected to Supabase, this endpoint
          returns a JSON status response.
        </p>
        <a href={healthUrl} target="_blank" rel="noopener noreferrer">
          Open {healthUrl}
        </a>
      </section>
    </main>
  );
}
