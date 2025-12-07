"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Anuncio = {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo: string;
  preco: number | null;
  status: string | null;
  criado_em: string | null;
  contacto_nome: string | null;
};

const wrapperStyle = {
  maxWidth: "960px",
  margin: "24px auto",
  padding: "16px 0 24px",
} as const;

const titleStyle = {
  fontSize: "22px",
  fontWeight: 700,
  marginBottom: "12px",
} as const;

const infoTextStyle = {
  fontSize: "14px",
  color: "#4b5563",
  marginBottom: "16px",
} as const;

const listStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
} as const;

const cardStyle = {
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#ffffff",
  display: "grid",
  gridTemplateColumns: "minmax(0, 2.5fr) minmax(0, 1.5fr)",
  gap: "12px",
  alignItems: "center",
} as const;

const cardTitleStyle = {
  fontSize: "16px",
  fontWeight: 600,
  marginBottom: "4px",
} as const;

const badgeStyle = {
  display: "inline-block",
  padding: "3px 8px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 600,
  backgroundColor: "#eef2ff",
  color: "#3730a3",
  marginRight: "8px",
} as const;

const priceStyle = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#111827",
  marginTop: "4px",
} as const;

const metaStyle = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "4px",
} as const;

const contactStyle = {
  fontSize: "13px",
  color: "#111827",
  marginTop: "4px",
} as const;

const actionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
} as const;

const baseButtonStyle = {
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
} as const;

const approveButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#16a34a",
  color: "#ffffff",
} as const;

const rejectButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#f97316",
  color: "#111827",
} as const;

const disabledButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#e5e7eb",
  color: "#9ca3af",
  cursor: "default",
} as const;

export default function PendentesPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // 1) Verifica se o utilizador é admin
  useEffect(() => {
    async function checkAdminAndLoad() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // VER AQUI: agora selecionamos "user_id" (que existe)
      const { data: adminRow, error: adminError } = await supabase
        .from("global_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        console.error(adminError);
        setError("Erro ao verificar permissões.");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const userIsAdmin = !!adminRow;
      setIsAdmin(userIsAdmin);

      if (!userIsAdmin) {
        setLoading(false);
        return;
      }

      // Se for admin, carrega os anúncios pendentes
      const { data, error: adsError } = await supabase
        .from("anuncios")
        .select(
          `
          id,
          titulo,
          descricao,
          tipo,
          preco,
          status,
          criado_em,
          contacto_nome
        `
        )
        .eq("status", "pending")
        .order("criado_em", { ascending: false });

      if (adsError) {
        console.error(adsError);
        setError("Erro ao carregar anúncios pendentes.");
      } else {
        setAnuncios(data || []);
      }

      setLoading(false);
    }

    checkAdminAndLoad();
  }, []);

  async function atualizarStatus(
    anuncioId: number,
    novoStatus: "approved" | "rejected"
  ) {
    setActionLoadingId(anuncioId);
    setError(null);

    const { error: updateError } = await supabase
      .from("anuncios")
      .update({ status: novoStatus })
      .eq("id", anuncioId);

    if (updateError) {
      console.error(updateError);
      setError("Erro ao atualizar o status do anúncio.");
      setActionLoadingId(null);
      return;
    }

    // Remove da lista local
    setAnuncios((prev) => prev.filter((a) => a.id !== anuncioId));
    setActionLoadingId(null);
  }

  if (loading) {
    return (
      <div style={wrapperStyle}>
        <h1 style={titleStyle}>Pendentes</h1>
        <p style={infoTextStyle}>A carregar anúncios pendentes…</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div style={wrapperStyle}>
        <h1 style={titleStyle}>Pendentes</h1>
        <p style={infoTextStyle}>
          Esta área é apenas para administradores. Caso precise de acesso,
          fala com o responsável pelo CampusMarket.
        </p>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <h1 style={titleStyle}>Pendentes</h1>
      <p style={infoTextStyle}>
        Aqui aparecem os anúncios enviados pelos utilizadores que ainda não
        foram aprovados. Ao aprovar, eles passam a ficar visíveis na página
        principal.
      </p>

      {error && (
        <p style={{ ...infoTextStyle, color: "#dc2626" }}>{error}</p>
      )}

      {anuncios.length === 0 ? (
        <p style={infoTextStyle}>
          Neste momento não há anúncios pendentes de aprovação. ✨
        </p>
      ) : (
        <div style={listStyle}>
          {anuncios.map((anuncio) => {
            const preco =
              anuncio.preco != null
                ? `${anuncio.preco.toLocaleString("pt-PT", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}€`
                : "—";

            const criadoEm =
              anuncio.criado_em &&
              new Date(anuncio.criado_em).toLocaleString("pt-PT", {
                dateStyle: "short",
                timeStyle: "short",
              });

            const isActing = actionLoadingId === anuncio.id;

            return (
              <div key={anuncio.id} style={cardStyle}>
                <div>
                  <div style={cardTitleStyle}>{anuncio.titulo}</div>
                  <span style={badgeStyle}>
                    {anuncio.tipo.toUpperCase()}
                  </span>
                  <span style={priceStyle}>{preco}</span>

                  {criadoEm && (
                    <div style={metaStyle}>Criado em {criadoEm}</div>
                  )}

                  {anuncio.contacto_nome && (
                    <div style={contactStyle}>
                      <strong>Responsável: </strong>
                      {anuncio.contacto_nome}
                    </div>
                  )}

                  {anuncio.descricao && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#4b5563",
                        marginTop: "6px",
                      }}
                    >
                      {anuncio.descricao.length > 120
                        ? anuncio.descricao.slice(0, 120) + "…"
                        : anuncio.descricao}
                    </div>
                  )}
                </div>

                <div style={actionsStyle}>
                  <button
                    type="button"
                    style={
                      isActing ? disabledButtonStyle : rejectButtonStyle
                    }
                    disabled={isActing}
                    onClick={() =>
                      atualizarStatus(anuncio.id, "rejected")
                    }
                  >
                    Rejeitar
                  </button>
                  <button
                    type="button"
                    style={
                      isActing ? disabledButtonStyle : approveButtonStyle
                    }
                    disabled={isActing}
                    onClick={() =>
                      atualizarStatus(anuncio.id, "approved")
                    }
                  >
                    Aprovar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
