"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { StartChatButton } from "@/components/StartChatButton";
import VendaStatusControls, {
  VendaStatus,
} from "@/components/VendaStatusControls";
import AdImageGallery from "@/components/AdImageGallery";

type AnuncioRow = {
  id: number;
  titulo?: string | null;
  descricao?: string | null;
  preco?: number | null;
  tipo?: string | null;
  status?: string | null;
  venda_status?: VendaStatus | null;
  owner_id: string | null;
  criado_em?: string | null;
  contacto_nome?: string | null;
  contacto_departamento?: string | null;
  contacto_telefone?: string | null;
  org_id?: number | null;
};

function formatPrice(preco: number | null | undefined) {
  if (preco === null || preco === undefined) return "";
  return `${preco.toString()}€`;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ESTILOS BÁSICOS **/

const pageWrapper: CSSProperties = {
  maxWidth: "1120px",
  margin: "24px auto",
  padding: "16px",
};

const cardWrapper: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
  gap: "24px",
  alignItems: "flex-start",
};

const leftBox: CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
};

const rightBox: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const titleStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  marginBottom: 4,
};

const priceStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: "#111827",
  marginTop: 8,
};

const badgeRow: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginTop: 8,
  flexWrap: "wrap",
};

const tipoBadge: CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  backgroundColor: "#111827",
  color: "#ffffff",
};

const statusBadgeBase: CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

const dateText: CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  marginTop: 8,
};

const sectionCard: CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
};

const sectionTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 8,
};

const bodyText: CSSProperties = {
  fontSize: 14,
  color: "#111827",
  whiteSpace: "pre-line",
};

const mutedText: CSSProperties = {
  fontSize: 13,
  color: "#4b5563",
};

export default function AnuncioPage() {
  const pathname = usePathname();

  const [anuncio, setAnuncio] = useState<AnuncioRow | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      setErro(null);

      // 1) Obter ID da URL: /anuncio/23 -> "23"
      const segments = (pathname ?? "").split("/").filter(Boolean);
      const lastSegment = segments[segments.length - 1] ?? null;
      const adId = lastSegment ? Number(lastSegment) : NaN;

      if (!lastSegment || Number.isNaN(adId)) {
        setErro("Anúncio inválido.");
        setLoading(false);
        return;
      }

      // 2) Utilizador atual
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Erro ao obter utilizador:", userError);
        setErro(
          "A tua sessão expirou ou é inválida. Faz login novamente para ver este anúncio."
        );
        setLoading(false);
        return;
      }

      const user = userData?.user ?? null;
      setCurrentUserId(user?.id ?? null);

      // 3) Buscar anúncio – select("*") para usar exatamente o schema atual
      const { data, error } = await supabase
        .from("anuncios")
        .select("*")
        .eq("id", adId)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar anúncio:", error);
        setErro("Não foi possível carregar este anúncio.");
        setLoading(false);
        return;
      }

      if (!data) {
        setErro("Anúncio não encontrado ou sem permissões de acesso.");
        setLoading(false);
        return;
      }

      setAnuncio(data as AnuncioRow);
      setLoading(false);
    };

    if (pathname) {
      void carregar();
    }
  }, [pathname]);

  if (loading) {
    return (
      <main style={pageWrapper}>
        <p style={{ fontSize: 14 }}>A carregar anúncio…</p>
      </main>
    );
  }

  if (erro || !anuncio) {
    return (
      <main style={pageWrapper}>
        <p
          style={{
            fontSize: 14,
            marginBottom: 12,
            color: "#b91c1c",
            backgroundColor: "#fee2e2",
            borderRadius: 8,
            padding: "8px 10px",
          }}
        >
          {erro ?? "Não foi possível carregar este anúncio."}
        </p>
        <Link href="/anuncios" style={{ fontSize: 13, color: "#0369a1" }}>
          ← Voltar aos anúncios
        </Link>
      </main>
    );
  }

  const isOwner =
    !!currentUserId && !!anuncio.owner_id && currentUserId === anuncio.owner_id;

  const precoFormatado = formatPrice(anuncio.preco);
  const createdAt = formatDate(anuncio.criado_em);
  const vendaStatus: VendaStatus =
    (anuncio.venda_status as VendaStatus) ?? "disponivel";

  let statusBadge: { text: string; style: CSSProperties } | null = null;

  if (vendaStatus === "vendido") {
    statusBadge = {
      text: "VENDIDO",
      style: {
        ...statusBadgeBase,
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
      },
    };
  } else if (vendaStatus === "reservado") {
    statusBadge = {
      text: "RESERVADO",
      style: {
        ...statusBadgeBase,
        backgroundColor: "#fef3c7",
        color: "#92400e",
      },
    };
  } else if (vendaStatus === "disponivel") {
    statusBadge = {
      text: "DISPONÍVEL",
      style: {
        ...statusBadgeBase,
        backgroundColor: "#dcfce7",
        color: "#166534",
      },
    };
  }

  return (
    <main style={pageWrapper}>
      <Link href="/anuncios" style={{ fontSize: 13, color: "#0369a1" }}>
        ← Voltar aos anúncios
      </Link>

      <section style={{ marginTop: 16 }}>
        <div style={cardWrapper}>
          {/* COLUNA ESQUERDA – GALERIA */}
          <div style={leftBox}>
            <AdImageGallery adId={anuncio.id} />
          </div>

          {/* COLUNA DIREITA – INFO */}
          <div style={rightBox}>
            {/* Cabeçalho / meta */}
            <div style={sectionCard}>
              <h1 style={titleStyle}>
                {anuncio.titulo ?? "Anúncio sem título"}
              </h1>

              {precoFormatado && <p style={priceStyle}>{precoFormatado}</p>}

              <div style={badgeRow}>
                {anuncio.tipo && (
                  <span style={tipoBadge}>{anuncio.tipo.toUpperCase()}</span>
                )}
                {statusBadge && (
                  <span style={statusBadge.style}>{statusBadge.text}</span>
                )}
              </div>

              {createdAt && (
                <p style={dateText}>Publicado em {createdAt}</p>
              )}
            </div>

            {/* Descrição */}
            <div style={sectionCard}>
              <h2 style={sectionTitle}>Descrição</h2>
              <p style={bodyText}>
                {anuncio.descricao && anuncio.descricao.trim().length > 0
                  ? anuncio.descricao
                  : "Sem descrição adicionada."}
              </p>
            </div>

            {/* Contacto + ações */}
            <div style={sectionCard}>
              <h2 style={sectionTitle}>Contacto do anunciante</h2>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                {anuncio.contacto_nome && (
                  <span style={mutedText}>
                    <strong>Nome:</strong> {anuncio.contacto_nome}
                  </span>
                )}
                {anuncio.contacto_departamento && (
                  <span style={mutedText}>
                    <strong>Departamento / setor:</strong>{" "}
                    {anuncio.contacto_departamento}
                  </span>
                )}
                {anuncio.contacto_telefone && (
                  <span style={mutedText}>
                    <strong>Telefone / WhatsApp:</strong>{" "}
                    {anuncio.contacto_telefone}
                  </span>
                )}
              </div>

              {/* Controlo de venda (apenas dono) */}
              {isOwner && currentUserId && anuncio.owner_id && (
                <div
                  style={{
                    marginTop: 16,
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: 12,
                  }}
                >
                  <VendaStatusControls
                    adId={anuncio.id}
                    orgId={anuncio.org_id ?? null}
                    sellerId={anuncio.owner_id}
                    currentUserId={currentUserId}
                    currentStatus={vendaStatus}
                    onStatusChanged={(newStatus) => {
                      setAnuncio((prev) =>
                        prev ? { ...prev, venda_status: newStatus } : prev
                      );
                    }}
                  />
                </div>
              )}

              {/* Botão de chat – só se não for dono */}
              {currentUserId && !isOwner && anuncio.owner_id && (
                <div style={{ marginTop: 18 }}>
                  <StartChatButton
                    adId={anuncio.id}
                    ownerId={anuncio.owner_id}
                  />
                </div>
              )}

              {!currentUserId && (
                <p
                  style={{
                    marginTop: 12,
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  Para contactar o anunciante, faz login na plataforma.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
