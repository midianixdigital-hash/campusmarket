import { supabase } from "@/lib/supabase";
import { StartChatButton } from "@/components/StartChatButton";
import { VendaStatusControls } from "@/components/VendaStatusControls";
import { AdImageGallery } from "@/components/AdImageGallery";
import Link from "next/link";

function formatPrice(preco: number | null) {
  if (preco === null || preco === undefined) return "";
  return `${preco.toString()}€`;
}

function formatDate(dateStr: string | null) {
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

const pageWrapper: React.CSSProperties = {
  maxWidth: "1120px",
  margin: "24px auto",
  padding: "16px",
};

const cardWrapper: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
  gap: "24px",
  alignItems: "flex-start",
};

const leftBox: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
};

const rightBox: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  marginBottom: 4,
};

const priceStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: "#111827",
  marginTop: 8,
};

const badgeRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginTop: 8,
  flexWrap: "wrap",
};

const tipoBadge: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  backgroundColor: "#111827",
  color: "#ffffff",
};

const statusBadgeBase: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

const dateText: React.CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  marginTop: 8,
};

const sectionCard: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 8,
};

const bodyText: React.CSSProperties = {
  fontSize: 14,
  color: "#111827",
  whiteSpace: "pre-line",
};

const mutedText: React.CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
};

const backLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 14,
  color: "#111827",
  textDecoration: "none",
  marginBottom: 16,
};

type ParamsPromise = Promise<{
  id: string;
}>;

export default async function AnuncioPage({
  params,
}: {
  params: ParamsPromise;
}) {
  const { id } = await params;

  const anuncioId = Number(id);

  if (!id || Number.isNaN(anuncioId)) {
    return (
      <main style={pageWrapper}>
        <p>ID do anúncio não foi informado.</p>
      </main>
    );
  }

  const { data: anuncio, error } = await supabase
    .from("anuncios")
    .select(
      `
      id,
      titulo,
      descricao,
      tipo,
      preco,
      status,
      venda_status,
      criado_em,
      imagens,
      contacto_nome,
      contacto_departamento,
      contacto_telefone,
      owner_id
    `
    )
    .eq("id", anuncioId)
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  if (!anuncio) {
    return (
      <main style={pageWrapper}>
        <p>Não foi possível carregar este anúncio.</p>
      </main>
    );
  }

  const imagens: string[] = Array.isArray(anuncio.imagens)
    ? anuncio.imagens
    : [];

  const precoFormatado = formatPrice(anuncio.preco);
  const dataFormatada = formatDate(anuncio.criado_em);

  const hasContact =
    anuncio.contacto_nome ||
    anuncio.contacto_departamento ||
    anuncio.contacto_telefone;

  let statusBadge: React.ReactNode = null;
  if (anuncio.status === "approved") {
    statusBadge = (
      <span
        style={{
          ...statusBadgeBase,
          backgroundColor: "#dcfce7",
          color: "#15803d",
        }}
      >
        APROVADO
      </span>
    );
  } else if (anuncio.status === "pending") {
    statusBadge = (
      <span
        style={{
          ...statusBadgeBase,
          backgroundColor: "#fef9c3",
          color: "#92400e",
        }}
      >
        PENDENTE
      </span>
    );
  } else if (anuncio.status === "rejected") {
    statusBadge = (
      <span
        style={{
          ...statusBadgeBase,
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
        }}
      >
        REJEITADO
      </span>
    );
  }

  return (
    <main style={pageWrapper}>
      <Link href="/anuncios" style={backLink}>
        ← Voltar aos anúncios
      </Link>

      <div style={cardWrapper}>
        {/* LADO ESQUERDO – galeria de imagens com lightbox */}
        <div style={leftBox}>
          <AdImageGallery images={imagens} title={anuncio.titulo ?? "Anúncio"} />
        </div>

        {/* LADO DIREITO – info + descrição + contacto */}
        <div style={rightBox}>
          {/* Info principal */}
          <div style={sectionCard}>
            <h1 style={titleStyle}>{anuncio.titulo}</h1>

            <div style={badgeRow}>
              <span style={tipoBadge}>{anuncio.tipo?.toUpperCase()}</span>
              {statusBadge}

              {/* badge de venda / disponibilidade + botões pro dono */}
              <VendaStatusControls
                adId={anuncio.id}
                ownerId={anuncio.owner_id}
                initialStatus={anuncio.venda_status ?? "disponivel"}
              />
            </div>

            {precoFormatado && <div style={priceStyle}>{precoFormatado}</div>}

            {dataFormatada && (
              <p style={dateText}>Publicado em {dataFormatada}</p>
            )}
          </div>

          {/* Descrição */}
          <div style={sectionCard}>
            <h2 style={sectionTitle}>Descrição</h2>
            {anuncio.descricao ? (
              <p style={bodyText}>{anuncio.descricao}</p>
            ) : (
              <p style={mutedText}>
                Este anúncio ainda não tem descrição adicionada.
              </p>
            )}
          </div>

          {/* Contacto do anunciante + botão de chat */}
          <div style={sectionCard}>
            <h2 style={sectionTitle}>Contacto do anunciante</h2>

            {!hasContact ? (
              <p style={mutedText}>
                Este anúncio ainda não tem dados de contacto preenchidos.
              </p>
            ) : (
              <>
                {anuncio.contacto_nome && (
                  <p style={bodyText}>
                    <strong>Nome: </strong>
                    {anuncio.contacto_nome}
                  </p>
                )}
                {anuncio.contacto_departamento && (
                  <p style={bodyText}>
                    <strong>Departamento / setor: </strong>
                    {anuncio.contacto_departamento}
                  </p>
                )}
                {anuncio.contacto_telefone && (
                  <p style={bodyText}>
                    <strong>Telefone / WhatsApp: </strong>
                    {anuncio.contacto_telefone}
                  </p>
                )}
              
                {anuncio.owner_id && (
                  <StartChatButton adId={anuncio.id} ownerId={anuncio.owner_id} />
                )}
              </>
            )}
          </div>
        </div>
        
      </div>
    </main>
  );
}
