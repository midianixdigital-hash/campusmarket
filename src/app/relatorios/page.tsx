"use client";

import { useEffect, useState, CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

type AnuncioRow = {
  id: number;
  titulo: string | null;
  descricao: string | null;
  preco: number | null;
  status: string | null;
  venda_status: string | null;
  tipo: string | null;
  criado_em: string | null;
  org_id: number | null;
};

type OrgRow = {
  id: number;
  name: string | null;
  contract_seats: number | null;
};

type MembershipRow = {
  organization_id: number;
};

// --- cores da marca ---
const PRIMARY = "#1bb5b8";
const PRIMARY_DARK = "#14888a";
const PRIMARY_SOFT = "#e0f7f8";

// --- estilos de layout / cards ---
const pageWrapper: CSSProperties = {
  maxWidth: 1120,
  margin: "24px auto 40px auto",
  padding: "0 16px",
};

const titleStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 4,
};

const subtitleStyle: CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 24,
};

const cardsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 16,
  marginBottom: 24,
};

const summaryCard: CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 2px 10px rgba(15,23,42,0.06)",
};

const cardTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 8,
};

const cardNumber: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: PRIMARY_DARK,
};

const cardHint: CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  marginTop: 6,
};

// --- caixa de exportação ---
const exportBox: CSSProperties = {
  marginTop: 12,
  padding: 20,
  borderRadius: 18,
  backgroundColor: PRIMARY_SOFT,
  border: `1px solid rgba(27,181,184,0.45)`,
  boxShadow: "0 12px 30px rgba(27,181,184,0.18)",
};

const exportTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 4,
};

const exportText: CSSProperties = {
  fontSize: 13,
  color: "#4b5563",
  marginBottom: 16,
};

const exportButtonsRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
};

const primaryButton: CSSProperties = {
  padding: "8px 18px",
  borderRadius: 999,
  border: "none",
  backgroundColor: PRIMARY,
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButton: CSSProperties = {
  padding: "8px 18px",
  borderRadius: 999,
  border: `1px solid ${PRIMARY}`,
  backgroundColor: "#ffffff",
  color: PRIMARY_DARK,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const helperNote: CSSProperties = {
  fontSize: 11,
  color: "#6b7280",
  marginTop: 8,
};

// --- caixa ESG ---
const esgSection: CSSProperties = {
  marginTop: 28,
};

const esgTitleRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 8,
};

const esgBadge: CSSProperties = {
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  backgroundColor: PRIMARY,
  color: "#ffffff",
};

const esgCardsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 16,
  marginTop: 12,
};

const esgCard: CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 2px 10px rgba(15,23,42,0.06)",
};

const esgLabel: CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "#6b7280",
  marginBottom: 4,
};

const esgValue: CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: PRIMARY_DARK,
};

const esgFootnote: CSSProperties = {
  fontSize: 11,
  color: "#6b7280",
  marginTop: 8,
};

// --- aviso bonito (no lugar do alert) ---
const noticeBox: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  marginBottom: 16,
  borderRadius: 12,
  backgroundColor: PRIMARY_SOFT,
  border: `1px solid rgba(27,181,184,0.6)`,
  boxShadow: "0 10px 25px rgba(27,181,184,0.15)",
  fontSize: 13,
  color: "#0f172a",
};

const noticeDot: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  backgroundColor: PRIMARY,
  flexShrink: 0,
};

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [currentOrg, setCurrentOrg] = useState<OrgRow | null>(null);
  const [anuncios, setAnuncios] = useState<AnuncioRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // métricas
  const totalAds = anuncios.length;
  const approvedAds = anuncios.filter((a) => a.status === "approved").length;
  const completedTransactions = anuncios.filter(
    (a) => a.venda_status === "vendido"
  ).length;

  // ESG simples baseado nas transações concluídas
  const itensReutilizados = completedTransactions;
  const co2EstimadoTon = itensReutilizados * 0.004; // fator aproximado
  const comunidadeAtivaPercent =
    currentOrg?.contract_seats && currentOrg.contract_seats > 0
      ? Math.min(
          100,
          Math.round((totalAds / currentOrg.contract_seats) * 100)
        )
      : null;

  // auto-fechar aviso depois de alguns segundos
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) Sessão
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        let orgId: number | null = null;

        if (user) {
          // 2) Organização do utilizador
          const { data: membership, error: membershipError } = await supabase
            .from("user_organizations")
            .select("organization_id")
            .eq("user_id", user.id)
            .eq("is_blocked", false)
            .limit(1)
            .maybeSingle<MembershipRow>();

          if (membershipError) {
            console.error(membershipError);
          } else if (membership?.organization_id) {
            orgId = membership.organization_id;

            const { data: orgRow, error: orgError } = await supabase
              .from("organizations")
              .select("id, name, contract_seats")
              .eq("id", orgId)
              .maybeSingle<OrgRow>();

            if (orgError) {
              console.error(orgError);
            } else if (!cancelled) {
              setCurrentOrg(orgRow ?? null);
            }
          }
        }

        // 3) Buscar anúncios (filtrando por org, se existir)
        let query = supabase.from("anuncios").select("*") as any;

        if (orgId) {
          query = query.eq("org_id", orgId);
        }

        const { data: adsData, error: adsError } = await query;

        if (adsError) throw adsError;

        if (!cancelled) {
          setAnuncios((adsData ?? []) as AnuncioRow[]);
        }
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          setError(
            err?.message ??
              "Não foi possível carregar os dados de relatórios."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleExportCsv() {
    if (!anuncios.length) {
      setNotice(
        "Ainda não há dados para exportar. Assim que existirem anúncios na tua organização, o relatório fica disponível."
      );
      return;
    }

    const header = [
      "ID",
      "Título",
      "Descrição",
      "Preço",
      "Tipo",
      "Estado",
      "Situação venda",
      "Criado em",
    ];

    const rows = anuncios.map((a) => [
      a.id,
      a.titulo ?? "",
      (a.descricao ?? "").replace(/\s+/g, " "),
      a.preco ?? "",
      a.tipo ?? "",
      a.status ?? "",
      a.venda_status ?? "",
      a.criado_em ?? "",
    ]);

    const csvContent =
      [header, ...rows]
        .map((cols) =>
          cols
            .map((c) => `"${String(c).replace(/"/g, '""')}"`)
            .join(";")
        )
        .join("\n") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const orgName = currentOrg?.name ?? "campusmarket";
    link.download = `relatorio-${orgName.toLowerCase().replace(/\s+/g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotice("Exportação CSV iniciada. Confere o ficheiro na tua pasta de downloads.");
  }

  async function handleExportPdf() {
    if (!anuncios.length) {
      setNotice(
        "Ainda não há dados para exportar em PDF. Cria ou aprova alguns anúncios primeiro."
      );
      return;
    }

    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF("p", "mm", "a4");

    const orgName = currentOrg?.name ?? "CampusMarket";
    const generatedAt = new Date();
    const dataStr = generatedAt.toLocaleDateString("pt-PT");
    const horaStr = generatedAt.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const marginLeft = 16;
    const maxWidth = 180; // largura útil
    let y = 18;

    const ensureSpace = (needed: number) => {
      if (y + needed > 270) {
        doc.addPage();
        y = 20;
      }
    };

    const addSectionTitle = (text: string, index: number) => {
      ensureSpace(10);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${index}. ${text}`, marginLeft, y);
      y += 6;
      doc.setDrawColor(209, 213, 219);
      doc.line(marginLeft, y, marginLeft + 60, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    };

    // CABEÇALHO
    doc.setTextColor(27, 181, 184);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Relatório CampusMarket", marginLeft, y);
    y += 8;

    doc.setFontSize(13);
    doc.text(orgName, marginLeft, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(10);
    doc.text(`Gerado em ${dataStr} às ${horaStr}`, marginLeft, y);
    y += 4;
    doc.text(
      "Período analisado: todos os anúncios registados até à data de geração.",
      marginLeft,
      y
    );
    y += 8;

    doc.setDrawColor(209, 213, 219);
    doc.line(marginLeft, y, 195, y);
    y += 8;

    // 1. VISÃO GERAL
    addSectionTitle("Visão geral de utilização", 1);

    const bullet = (txt: string) => {
      const lines = doc.splitTextToSize(txt, maxWidth);
      ensureSpace(4 * lines.length + 2);
      doc.circle(marginLeft + 1, y - 1.5, 0.7, "F");
      doc.text(lines, marginLeft + 4, y);
      y += 4 * lines.length;
    };

    bullet(`Anúncios criados: ${totalAds}`);
    bullet(`Anúncios aprovados: ${approvedAds}`);
    bullet(
      `Transações concluídas (marcadas como "vendido"): ${completedTransactions}`
    );

    if (currentOrg?.contract_seats) {
      bullet(
        `Lugares contratados (utilizadores previstos no contrato): ${currentOrg.contract_seats}`
      );
    }

    if (comunidadeAtivaPercent !== null) {
      bullet(
        `Comunidade ativa estimada: ${comunidadeAtivaPercent}% dos lugares contratados já publicaram anúncios.`
      );
    }

    // 2. DETALHE POR ESTADO E TIPO
    addSectionTitle("Detalhe de anúncios", 2);

    const porStatus: Record<string, number> = {};
    const porTipo: Record<string, number> = {};

    anuncios.forEach((a) => {
      const st = a.status ?? "sem estado";
      porStatus[st] = (porStatus[st] ?? 0) + 1;

      const tp = a.tipo ?? "não definido";
      porTipo[tp] = (porTipo[tp] ?? 0) + 1;
    });

    doc.setFont("helvetica", "bold");
    doc.text("Por estado:", marginLeft, y);
    y += 5;
    doc.setFont("helvetica", "normal");

    Object.entries(porStatus).forEach(([st, count]) => {
      bullet(`• ${st}: ${count} anúncio(s)`);
    });

    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.text("Por tipo:", marginLeft, y);
    y += 5;
    doc.setFont("helvetica", "normal");

    Object.entries(porTipo).forEach(([tp, count]) => {
      bullet(`• ${tp}: ${count} anúncio(s)`);
    });

    // 3. INDICADORES ESG
    addSectionTitle("Indicadores ESG (estimativos)", 3);

    const co2Str = co2EstimadoTon.toLocaleString("pt-PT", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 1,
    });

    bullet(
      `Itens reutilizados: ${itensReutilizados}. Consideramos cada transação concluída como um item que ganhou uma nova vida dentro da comunidade.`
    );
    bullet(
      `CO₂ evitado (estimado): ${co2Str} toneladas. Este valor é calculado com base numa aproximação simples por item reutilizado.`
    );
    bullet(
      `Comunidade ativa: ${
        comunidadeAtivaPercent !== null
          ? comunidadeAtivaPercent + "%"
          : "não disponível"
      }. Este indicador ajuda a ligar o CampusMarket ao pilar de envolvimento social.`
    );

    ensureSpace(16);
    const esgDescr =
      "Estes números são indicativos e servem como apoio ao relatório de sustentabilidade da organização. Podem ser ajustados futuramente com fatores de conversão mais precisos, definidos em conjunto com a equipa ESG.";
    const esgLines = doc.splitTextToSize(esgDescr, maxWidth);
    doc.text(esgLines, marginLeft, y);
    y += 4 * esgLines.length;

    // 4. PRINCIPAIS ANÚNCIOS
    addSectionTitle("Principais anúncios (top 10)", 4);

    const topAds = [...anuncios]
      .sort((a, b) => {
        const av = a.venda_status === "vendido" ? 1 : 0;
        const bv = b.venda_status === "vendido" ? 1 : 0;
        return bv - av || (b.preco ?? 0) - (a.preco ?? 0);
      })
      .slice(0, 10);

    if (!topAds.length) {
      bullet("Ainda não existem anúncios suficientes para compor esta lista.");
    } else {
      topAds.forEach((a, idx) => {
        const linha = `#${a.id} · ${a.titulo ?? "Sem título"} · ${
          a.preco ?? "-"
        }€ · tipo: ${a.tipo ?? "-"} · estado: ${
          a.status ?? "-"
        } · situação: ${a.venda_status ?? "-"}`;
        const lines = doc.splitTextToSize(linha, maxWidth);
        ensureSpace(4 * lines.length + 2);
        doc.text(`${idx + 1}.`, marginLeft, y);
        doc.text(lines, marginLeft + 8, y);
        y += 4 * lines.length;
      });
    }

    // 5. NOTA METODOLÓGICA / RODAPÉ
    ensureSpace(18);
    doc.setFont("helvetica", "bold");
    doc.text("Nota metodológica", marginLeft, y);
    y += 5;
    doc.setFont("helvetica", "normal");

    const nota =
      "Este relatório foi gerado automaticamente pela plataforma CampusMarket a partir dos dados registados em base de dados. As métricas podem variar ao longo do tempo conforme novos anúncios são criados, atualizados ou concluídos. Para decisões formais de reporte ESG, recomenda-se validar estes números com a equipa responsável pelo relato corporativo.";
    const notaLines = doc.splitTextToSize(nota, maxWidth);
    doc.text(notaLines, marginLeft, y);

    const fileName = `relatorio-${orgName
      .toLowerCase()
      .replace(/\s+/g, "-")}-${dataStr}.pdf`;
    doc.save(fileName);

    setNotice("PDF gerado com sucesso. Confere o ficheiro na tua pasta de downloads.");
  }

  return (
    <main style={pageWrapper}>
      <h1 style={titleStyle}>Relatórios &amp; visão geral</h1>
      <p style={subtitleStyle}>
        Visão consolidada da utilização do CampusMarket na tua organização.
        <br />
        Organização atual:{" "}
        <strong>{currentOrg?.name ?? "todas (sem organização definida)"}</strong>
      </p>

      {error && (
        <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 16 }}>
          {error}
        </p>
      )}

      {notice && (
        <div style={noticeBox}>
          <span style={noticeDot} />
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 14 }}>A carregar dados…</p>
      ) : (
        <>
          {/* cards principais */}
          <div style={cardsGrid}>
            <section style={summaryCard}>
              <h2 style={cardTitle}>Anúncios criados</h2>
              <p style={cardNumber}>{totalAds}</p>
              <p style={cardHint}>
                Inclui todos os estados (em análise, aprovados, concluídos…).
              </p>
            </section>

            <section style={summaryCard}>
              <h2 style={cardTitle}>Anúncios aprovados</h2>
              <p style={cardNumber}>{approvedAds}</p>
              <p style={cardHint}>
                Anúncios ativos que podem ser vistos pela comunidade.
              </p>
            </section>

            <section style={summaryCard}>
              <h2 style={cardTitle}>Transações concluídas</h2>
              <p style={cardNumber}>{completedTransactions}</p>
              <p style={cardHint}>
                Vendas/doações/trocas/alugueres marcados como concluídos.
              </p>
            </section>
          </div>

          {/* exportação */}
          <section style={exportBox}>
            <h2 style={exportTitle}>Exportar relatórios</h2>
            <p style={exportText}>
              CSV para Excel/Sheets e PDF pronto para apresentações. Disponível
              mesmo em planos gratuitos.
            </p>

            <div style={exportButtonsRow}>
              <button
                type="button"
                style={secondaryButton}
                onClick={handleExportCsv}
              >
                Exportar para Excel (CSV)
              </button>
              <button
                type="button"
                style={primaryButton}
                onClick={handleExportPdf}
              >
                Exportar PDF bonito
              </button>
            </div>

            <p style={helperNote}>
              * Se encontrarmos uma organização associada ao teu utilizador, o
              relatório filtra apenas essa org. Caso contrário, inclui todos os
              anúncios.
            </p>
          </section>

          {/* ESG & impacto */}
          <section style={esgSection}>
            <div style={esgTitleRow}>
              <span style={esgBadge}>Módulo ESG premium</span>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>
                ESG &amp; impacto (estimativas)
              </h2>
            </div>
            <p style={{ fontSize: 13, color: "#4b5563" }}>
              Estes números são calculados a partir das transações concluídas e
              podem ser ligados ao relatório de sustentabilidade da organização.
            </p>

            <div style={esgCardsGrid}>
              <div style={esgCard}>
                <p style={esgLabel}>Itens reutilizados</p>
                <p style={esgValue}>{itensReutilizados}</p>
                <p style={esgFootnote}>
                  Número estimado de itens desviados do lixo através de vendas,
                  doações, trocas e alugueres internos.
                </p>
              </div>

              <div style={esgCard}>
                <p style={esgLabel}>CO₂ evitado (estimado)</p>
                <p style={esgValue}>
                  {co2EstimadoTon.toLocaleString("pt-PT", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 1,
                  })}{" "}
                  t
                </p>
                <p style={esgFootnote}>
                  Conversão simples de itens reutilizados em toneladas de CO₂
                  evitadas, apenas como referência para comunicação ESG.
                </p>
              </div>

              <div style={esgCard}>
                <p style={esgLabel}>Comunidade ativa</p>
                <p style={esgValue}>
                  {comunidadeAtivaPercent !== null
                    ? `${comunidadeAtivaPercent}%`
                    : "—"}
                </p>
                <p style={esgFootnote}>
                  Percentual aproximado da comunidade com anúncios publicados,
                  comparando com os lugares contratados (se definidos).
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
