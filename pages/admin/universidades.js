import path from "path";
import fs from "fs/promises";
import Link from "next/link";

export default function AdminUniversidades({ registros }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background: "#020617",
        color: "#e5e7eb",
        fontFamily: "system-ui",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>
          Admin · Universidades
        </h1>

        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link href="/" style={{ color: "#9ca3af", textDecoration: "none" }}>
            Home
          </Link>
          <Link
            href="/admin/empresas"
            style={{ color: "#9ca3af", textDecoration: "none" }}
          >
            Admin empresas
          </Link>
        </nav>
      </header>

      {registros.length === 0 ? (
        <p>Sem registos ainda. Envia um formulário para aparecer aqui.</p>
      ) : (
        <div
          style={{
            overflowX: "auto",
            background: "#020617",
            borderRadius: "1rem",
            border: "1px solid #1f2937",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            padding: "1rem",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Nome</th>
                <th style={thStyle}>E-mail institucional</th>
                <th style={thStyle}>Universidade</th>
                <th style={thStyle}>Cargo</th>
                <th style={thStyle}>Mensagem</th>
                <th style={thStyle}>Data</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r, idx) => (
                <tr key={idx}>
                  <td style={tdStyle}>{r.nomeContato}</td>
                  <td style={tdStyle}>{r.emailInstitucional}</td>
                  <td style={tdStyle}>{r.universidade}</td>
                  <td style={tdStyle}>{r.cargo}</td>
                  <td style={{ ...tdStyle, maxWidth: "250px" }}>
                    {r.mensagem}
                  </td>
                  <td style={tdStyle}>
                    {r.criadoEm
                      ? new Date(r.criadoEm).toLocaleString("pt-PT")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "0.5rem",
  borderBottom: "1px solid #1f2937",
  fontSize: "0.9rem",
  color: "#9ca3af",
};

const tdStyle = {
  padding: "0.5rem",
  borderBottom: "1px solid #111827",
  fontSize: "0.9rem",
};

export async function getServerSideProps() {
  const filePath = path.join(process.cwd(), "data", "universidades.json");
  const fileData = await fs.readFile(filePath, "utf-8");
  const registros = JSON.parse(fileData || "[]");

  // ordena por data (mais recente primeiro)
  registros.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  return {
    props: {
      registros,
    },
  };
}
