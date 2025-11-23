import Link from "next/link";
import { useState } from "react";

export default function Empresas() {
  const [form, setForm] = useState({
    nomeContato: "",
    email: "",
    empresa: "",
    segmento: "",
    cidade: "",
    mensagem: "",
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const res = await fetch("/api/empresas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        alert("Algo correu mal ao enviar. Tente novamente.");
        return;
      }

      alert("Obrigado! Vamos analisar a parceria com a sua empresa.");

      setForm({
        nomeContato: "",
        email: "",
        empresa: "",
        segmento: "",
        cidade: "",
        mensagem: "",
      });
    } catch (err) {
      console.error(err);
      alert("Erro de rede ao enviar os dados.");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background: "#0f172a",
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
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>CampusMarket</h1>
        <Link href="/" style={{ color: "#9ca3af", textDecoration: "none" }}>
          Voltar para a página inicial
        </Link>
      </header>

      <section style={{ maxWidth: "800px" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          CampusMarket para Empresas
        </h2>

        <p style={{ maxWidth: "700px", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          Preencha os dados abaixo para registar o interesse da sua empresa em
          divulgar benefícios, vagas ou serviços para o público universitário.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "#020617",
            padding: "1.8rem",
            borderRadius: "1rem",
            border: "1px solid #1f2937",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.3rem" }}>
              Nome de contacto
            </label>
            <input
              type="text"
              name="nomeContato"
              value={form.nomeContato}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.3rem" }}>
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.3rem" }}>
              Empresa
            </label>
            <input
              type="text"
              name="empresa"
              value={form.empresa}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.3rem" }}>
              Segmento (restauração, tecnologia, saúde, etc.)
            </label>
            <input
              type="text"
              name="segmento"
              value={form.segmento}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.3rem" }}>
              Cidade / região
            </label>
            <input
              type="text"
              name="cidade"
              value={form.cidade}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.3rem" }}>
              Mensagem (tipo de oferta, vagas, ideias de parceria)
            </label>
            <textarea
              name="mensagem"
              value={form.mensagem}
              onChange={handleChange}
              rows={4}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
                resize: "vertical",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: "0.5rem",
              padding: "0.8rem 1.4rem",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              background: "#22c55e",
              color: "#022c22",
            }}
          >
            Enviar interesse da empresa
          </button>
        </form>
      </section>
    </main>
  );
}
