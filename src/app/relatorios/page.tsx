"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrgStatsRow = {
  org_id: number;
  name: string | null;
  tipo: string | null;
  slug: string | null;
  is_active: boolean | null;
  contract_seats: number | null;
  total_users: number | null;
  total_ads: number | null;
  total_ads_approved: number | null;
  total_ads_pending: number | null;
  total_ads_rejected: number | null;
  ads_disponiveis: number | null;
  ads_reservados: number | null;
  ads_vendidos: number | null;
  ads_venda: number | null;
  ads_troca: number | null;
  ads_aluguel: number | null;
  ads_doacao: number | null;
};

type AnuncioRow = {
  id: number;
  org_id: number | null;
  preco: number | null;
  tipo: string | null;
  status: string | null;
  venda_status: string | null;
  criado_em: string | null;
};

type RatingRow = {
  ad_id: number;
  rating: number | null;
};

type LoadingState = "idle" | "loading" | "loaded" | "error";

export default function RelatoriosPage() {
  const [loading, setLoading] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const [orgStats, setOrgStats] = useState<OrgStatsRow | null>(null);
  const [anuncios, setAnuncios] = useState<AnuncioRow[]>([]);

  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingsCount, setRatingsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading("loading");
      setError(null);

      // 1) Utilizador atual
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) {
        console.error(userErr);
      }

      if (!user) {
        if (!cancelled) {
          setError("Precisas de iniciar sessão para ver os relatórios.");
          setLoading("error");
        }
        return;
      }

      const userId = user.id;

      // 2) Descobrir organização do utilizador
      let orgId: number | null = null;

      // Primeiro tenta na user_organizations
      const { data: linkRow, error: linkErr } = await supabase
        .from("user_organizations")
        .select("organization_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (linkErr) {
        console.warn("Falha ao ler user_organizations:", linkErr);
      }

      if (linkRow?.organization_id != null) {
        orgId = linkRow.organization_id as number;
      } else {
        // fallback para organization_members (caso estejas a usar essa tabela)
        const { data: memberRow, error: memberErr } = await supabase
          .from("organization_members")
          .select("org_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (memberErr) {
          console.warn("Falha ao ler organization_members:", memberErr);
        }
        if (memberRow?.org_id != null) {
          orgId = memberRow.org_id as number;
        }
      }

      if (!orgId) {
        if (!cancelled) {
          setError(
            "Não foi possível encontrar a tua organização. Confirma se estás associado a alguma organização."
          );
          setLoading("error");
        }
        return;
      }

      // 3) Buscar linha agregada da view organization_stats
      const { data: statsRow, error: statsErr } = await supabase
        .from("organization_stats")
        .select("*")
        .eq("org_id", orgId)
        .maybeSingle();

      if (statsErr) {
        console.error(statsErr);
        if (!cancelled) {
          setError("Erro ao carregar estatísticas da organização.");
          setLoading("error");
        }
        return;
      }

      // 4) Buscar todos os anúncios desta organização
      const { data: adsData, error: adsErr } = await supabase
        .from("anuncios")
        .select("id, org_id, preco, tipo, status, venda_status, criado_em")
        .eq("org_id", orgId);

      if (adsErr) {
        console.error(adsErr);
        if (!cancelled) {
          setError("Erro ao carregar dados de anúncios.");
          setLoading("error");
        }
        return;
      }

      const ads = (adsData ?? []) as AnuncioRow[];

      // 5) (Opcional) Ler avaliações para calcular taxa de satisfação.
      //    Feito dentro de try/catch para NUNCA partir a página se a tabela for diferente.
      let localAvgRating: number | null = null;
      let localRatingsCount = 0;

      try {
        const adIds = ads.map((a) => a.id);
        if (adIds.length > 0) {
          const { data: ratingsData, error: ratingsErr } = await supabase
            .from("ad_ratings")
            .select("ad_id, rating")
            .in("ad_id", adIds);

          if (!ratingsErr && ratingsData) {
            const ratings = ratingsData as RatingRow[];
            const valid = ratings.filter(
              (r) => typeof r.rating === "number" && r.rating !== null
            );
            if (valid.length > 0) {
              localRatingsCount = valid.length;
              const sum = valid.reduce(
                (acc, r) => acc + (r.rating ?? 0),
                0
              );
              localAvgRating = sum / valid.length;
            }
          } else if (ratingsErr) {
            console.warn("Falha ao carregar ad_ratings:", ratingsErr);
          }
        }
      } catch (err) {
        console.warn("Erro ao calcular taxa de satisfação:", err);
      }

      if (cancelled) return;

      setOrgStats(statsRow as OrgStatsRow);
      setAnuncios(ads);
      setAvgRating(localAvgRating);
      setRatingsCount(localRatingsCount);
      setLoading("loaded");
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------- DERIVADOS / MÉTRICAS ----------------

  const resumo = useMemo(() => {
    if (!orgStats) {
      return null;
    }

    const totalAds = orgStats.total_ads ?? 0;
    const totalApproved = orgStats.total_ads_approved ?? 0;
    const totalPending = orgStats.total_ads_pending ?? 0;
    const totalRejected = orgStats.total_ads_rejected ?? 0;

    const totalVenda = orgStats.ads_venda ?? 0;
    const totalTroca = orgStats.ads_troca ?? 0;
    const totalAluguel = orgStats.ads_aluguel ?? 0;
    const totalDoacao = orgStats.ads_doacao ?? 0;

    const disponiveis = orgStats.ads_disponiveis ?? 0;
    const reservados = orgStats.ads_reservados ?? 0;
    const vendidos = orgStats.ads_vendidos ?? 0;

    const totalUsers = orgStats.total_users ?? 0;

    // Reutilizações = anúncios vendidos + doações
    const reuseCount = vendidos + totalDoacao;

    // Valor estimado da economia circular:
    // soma dos preços de anúncios vendidos + anúncios de doação (se tiverem preço definido)
    const economia = anuncios
      .filter(
        (a) =>
          (a.venda_status === "vendido" || a.tipo === "doacao") &&
          typeof a.preco === "number" &&
          a.preco !== null
      )
      .reduce((sum, a) => sum + (a.preco ?? 0), 0);

    return {
      totalAds,
      totalApproved,
      totalPending,
      totalRejected,
      totalVenda,
      totalTroca,
      totalAluguel,
      totalDoacao,
      disponiveis,
      reservados,
      vendidos,
      totalUsers,
      reuseCount,
      economia,
    };
  }, [orgStats, anuncios]);

  const chartByTipo = useMemo(() => {
    if (!resumo) return [];
    const items = [
      { label: "Venda", value: resumo.totalVenda, color: "#0ea5e9" },
      { label: "Troca", value: resumo.totalTroca, color: "#f97316" },
      { label: "Aluguer", value: resumo.totalAluguel, color: "#6366f1" },
      { label: "Doação", value: resumo.totalDoacao, color: "#22c55e" },
    ];
    const total = items.reduce((sum, i) => sum + i.value, 0) || 1;
    return items.map((i) => ({
      ...i,
      percent: Math.round((i.value / total) * 100),
    }));
  }, [resumo]);

  const chartByStatus = useMemo(() => {
    if (!resumo) return [];
    const items = [
      { label: "Disponíveis", value: resumo.disponiveis, color: "#22c55e" },
      { label: "Reservados", value: resumo.reservados, color: "#eab308" },
      { label: "Vendidos", value: resumo.vendidos, color: "#ef4444" },
    ];
    const total = items.reduce((sum, i) => sum + i.value, 0) || 1;
    return items.map((i) => ({
      ...i,
      percent: Math.round((i.value / total) * 100),
    }));
  }, [resumo]);

  // ---------------- HANDLERS ----------------

  function handleExportPDF() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  // ---------------- UI ----------------

  if (loading === "loading" || loading === "idle") {
    return (
      <main
        style={{
          maxWidth: 1120,
          margin: "24px auto",
          padding: "16px",
          fontSize: 14,
        }}
      >
        <p>A carregar relatórios…</p>
      </main>
    );
  }

  if (loading === "error" || !orgStats || !resumo) {
    return (
      <main
        style={{
          maxWidth: 1120,
          margin: "24px auto",
          padding: "16px",
          fontSize: 14,
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            marginBottom: 12,
          }}
        >
          {error || "Ocorreu um erro ao carregar os relatórios."}
        </div>
      </main>
    );
  }

  const nomeOrg = orgStats.name ?? "Organização";

  return (
    <main
      style={{
        maxWidth: 1120,
        margin: "24px auto",
        padding: "16px",
      }}
    >
      {/* Cabeçalho */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Relatórios e impacto
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280" }}>
            Indicadores consolidados de utilização do CampusMarket em{" "}
            <strong>{nomeOrg}</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPDF}
          style={{
            padding: "10px 18px",
            borderRadius: 999,
            border: "none",
            background:
              "linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(14,165,233,0.35)",
            whiteSpace: "nowrap",
          }}
        >
          Exportar PDF
        </button>
      </header>

      {/* Cards principais */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <ResumoCard
          title="Anúncios totais"
          value={resumo.totalAds}
          subtitle={`${resumo.totalApproved} aprovados · ${resumo.totalPending} pendentes · ${resumo.totalRejected} rejeitados`}
        />
        <ResumoCard
          title="Utilizadores registados"
          value={resumo.totalUsers}
          subtitle="Membros associados à organização"
        />
        <ResumoCard
          title="Doações"
          value={resumo.totalDoacao}
          subtitle="Itens que foram oferecidos sem custo"
        />
        <ResumoCard
          title="Reutilizações"
          value={resumo.reuseCount}
          subtitle="Vendidos + doações"
        />
        <ResumoCard
          title="Economia estimada"
          value={
            resumo.economia > 0
              ? resumo.economia.toLocaleString("pt-PT", {
                  style: "currency",
                  currency: "EUR",
                })
              : "–"
          }
          subtitle="Somatório de vendas e doações (preço estimado)"
        />
        <ResumoCard
          title="Taxa de satisfação"
          value={
            avgRating != null ? `${avgRating.toFixed(1)} / 5` : "Sem dados"
          }
          subtitle={
            ratingsCount > 0
              ? `${ratingsCount} avaliações registadas`
              : "Sem avaliações ainda"
          }
        />
      </section>

      {/* Gráfico por tipo de anúncio */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.2fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <ChartCard title="Distribuição por tipo de anúncio">
          {chartByTipo.length === 0 ? (
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              Sem dados suficientes.
            </p>
          ) : (
            <MiniBarChart items={chartByTipo} />
          )}
        </ChartCard>

        <ChartCard title="Estado dos anúncios (stock)">
          {chartByStatus.length === 0 ? (
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              Sem dados suficientes.
            </p>
          ) : (
            <MiniBarChart items={chartByStatus} />
          )}
        </ChartCard>
      </section>

      {/* Tabela resumo (fica linda no PDF também) */}
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Resumo numérico
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#f3f4f6",
                  textAlign: "left",
                }}
              >
                <Th>Indicador</Th>
                <Th>Valor</Th>
                <Th>Notas</Th>
              </tr>
            </thead>
            <tbody>
              <Tr>
                <Td>Anúncios totais</Td>
                <Td>{resumo.totalAds}</Td>
                <Td>
                  {resumo.totalApproved} aprovados, {resumo.totalPending}{" "}
                  pendentes, {resumo.totalRejected} rejeitados
                </Td>
              </Tr>
              <Tr>
                <Td>Por tipo</Td>
                <Td>
                  {resumo.totalVenda} venda · {resumo.totalTroca} troca ·{" "}
                  {resumo.totalAluguel} aluguer · {resumo.totalDoacao} doação
                </Td>
                <Td>Distribuição dos anúncios criados na organização</Td>
              </Tr>
              <Tr>
                <Td>Estado actual do stock</Td>
                <Td>
                  {resumo.disponiveis} disponíveis · {resumo.reservados}{" "}
                  reservados · {resumo.vendidos} vendidos
                </Td>
                <Td>Inclui apenas anúncios ativos na plataforma</Td>
              </Tr>
              <Tr>
                <Td>Utilizadores registados</Td>
                <Td>{resumo.totalUsers}</Td>
                <Td>Membros com acesso ao CampusMarket</Td>
              </Tr>
              <Tr>
                <Td>Doações</Td>
                <Td>{resumo.totalDoacao}</Td>
                <Td>Itens reutilizados sem transação monetária</Td>
              </Tr>
              <Tr>
                <Td>Reutilizações (impacto)</Td>
                <Td>{resumo.reuseCount}</Td>
                <Td>Vendidos + doações (potenciais itens desviados do lixo)</Td>
              </Tr>
              <Tr>
                <Td>Economia circular estimada</Td>
                <Td>
                  {resumo.economia > 0
                    ? resumo.economia.toLocaleString("pt-PT", {
                        style: "currency",
                        currency: "EUR",
                      })
                    : "–"}
                </Td>
                <Td>
                  Soma dos preços de anúncios vendidos e doações com preço
                  estimado.
                </Td>
              </Tr>
              <Tr>
                <Td>Taxa de satisfação</Td>
                <Td>
                  {avgRating != null
                    ? `${avgRating.toFixed(1)} / 5`
                    : "Sem dados"}
                </Td>
                <Td>
                  {ratingsCount > 0
                    ? `${ratingsCount} avaliações registadas`
                    : "Ainda não existem avaliações suficientes."}
                </Td>
              </Tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

/* --------- COMPONENTES AUXILIARES ---------- */

function ResumoCard(props: {
  title: string;
  value: number | string;
  subtitle?: string;
}) {
  return (
    <article
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 14,
        boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 0.08,
          color: "#6b7280",
          fontWeight: 600,
        }}
      >
        {props.title}
      </span>
      <strong
        style={{
          fontSize: 22,
          color: "#022c22",
        }}
      >
        {props.value}
      </strong>
      {props.subtitle && (
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {props.subtitle}
        </span>
      )}
    </article>
  );
}

function ChartCard(props: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
      }}
    >
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        {props.title}
      </h2>
      {props.children}
    </section>
  );
}

type MiniBarItem = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

function MiniBarChart({ items }: { items: MiniBarItem[] }) {
  const max = items.reduce((m, i) => Math.max(m, i.value), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => (
        <div key={item.label}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              marginBottom: 2,
            }}
          >
            <span>{item.label}</span>
            <span>
              {item.value} ({item.percent}%)
            </span>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              backgroundColor: "#e5e7eb",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(item.value / max) * 100}%`,
                height: "100%",
                backgroundColor: item.color,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------- TABELA SIMPLES ---------- */

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: "8px 10px",
        borderBottom: "1px solid #e5e7eb",
        fontWeight: 600,
        fontSize: 12,
        color: "#374151",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: "8px 10px",
        borderBottom: "1px solid #f3f4f6",
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

function Tr({ children }: { children: React.ReactNode }) {
  return <tr>{children}</tr>;
}
