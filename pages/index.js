export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#0f172a",
        color: "#e5e7eb",
      }}
    >
      <header style={{ marginBottom: "3rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", fontWeight: 700 }}>
          CampusMarket
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#9ca3af" }}>
          Conectando estudantes, universidades e empresas em um só lugar.
        </p>
      </header>

      <section
        style={{
          maxWidth: "800px",
          width: "100%",
          background: "#020617",
          padding: "2rem",
          borderRadius: "1.5rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          border: "1px solid #1f2937",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
          O que é o CampusMarket?
        </h2>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          Uma plataforma onde estudantes encontram descontos, serviços e oportunidades
          oferecidos por empresas parceiras e pela própria universidade.
        </p>

        <ul style={{ marginBottom: "1.5rem", paddingLeft: "1.2rem", lineHeight: 1.7 }}>
          <li>Benefícios exclusivos para estudantes universitários.</li>
          <li>Canal direto entre universidades e empresas.</li>
          <li>Espaço para empresas divulgarem ofertas, vagas e serviços.</li>
        </ul>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a href="/universidades">
  <button
    style={{
      padding: "0.8rem 1.4rem",
      borderRadius: "999px",
      border: "none",
      cursor: "pointer",
      fontWeight: 600,
      background: "#22c55e",
      color: "#022c22",
    }}
  >
    Quero testar na minha universidade
  </button>
</a>

<a href="/empresas">
  <button
    style={{
      padding: "0.8rem 1.4rem",
      borderRadius: "999px",
      border: "1px solid #4b5563",
      background: "transparent",
      color: "#e5e7eb",
      cursor: "pointer",
      fontWeight: 500,
    }}
  >
    Sou empresa e quero ser parceira
  </button>
</a>

        </div>
      </section>

      <footer style={{ marginTop: "2rem", fontSize: "0.85rem", color: "#6b7280" }}>
        MVP em desenvolvimento · CampusMarket · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
