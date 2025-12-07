"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  adId: number;
  ownerId: string; // seller_id
};

type RatingRow = {
  id: number;
  ad_id: number;
  seller_id: string;
  rater_id: string;
  rating: number;
  comment: string | null;
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
  marginTop: 16,
};

const titleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 8,
};

const smallText: React.CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
};

const starsRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginTop: 4,
};

const starStyle: React.CSSProperties = {
  fontSize: 18,
  cursor: "pointer",
};

const badgeRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginTop: 8,
};

const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  borderRadius: 999,
  padding: "2px 8px",
  backgroundColor: "#ecfdf5",
  color: "#047857",
};

const formRow: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 70,
  borderRadius: 8,
  border: "1px solid #d1d5db",
  padding: "6px 8px",
  fontSize: 13,
  resize: "vertical" as const,
};

const buttonRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 10,
};

const primaryButton: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "none",
  backgroundColor: "#047857",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  backgroundColor: "#f9fafb",
  color: "#111827",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
};

const errorText: React.CSSProperties = {
  fontSize: 13,
  color: "#b91c1c",
  marginTop: 4,
};

const successText: React.CSSProperties = {
  fontSize: 13,
  color: "#15803d",
  marginTop: 4,
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15,23,42,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

const modalCard: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 20px 40px rgba(15,23,42,0.25)",
};

export function AdRatingsWidget({ adId, ownerId }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);

  const [myRating, setMyRating] = useState<number | null>(null);
  const [myComment, setMyComment] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSaving, setReportSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;
        setUserId(user?.id ?? null);

        const { data, error } = await supabase
          .from("ad_ratings")
          .select("*")
          .eq("ad_id", adId);

        if (error) {
          console.error(error);
          return;
        }

        const rows = (data ?? []) as RatingRow[];
        if (rows.length > 0) {
          const sum = rows.reduce((acc, r) => acc + (r.rating ?? 0), 0);
          setAvgRating(sum / rows.length);
          setTotalRatings(rows.length);
        } else {
          setAvgRating(null);
          setTotalRatings(0);
        }

        if (user?.id) {
          const mine = rows.find((r) => r.rater_id === user.id);
          if (mine) {
            setMyRating(mine.rating);
            setMyComment(mine.comment ?? "");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [adId]);

  function renderStarsInteractive(value: number | null, onChange: (v: number) => void) {
    return (
      <div style={starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              ...starStyle,
              color: value !== null && star <= value ? "#f59e0b" : "#d1d5db",
            }}
            onClick={() => onChange(star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  }

  function renderStarsReadOnly(value: number) {
    const rounded = Math.round(value * 2) / 2;
    return (
      <div style={starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              ...starStyle,
              cursor: "default",
              color: star <= rounded ? "#f59e0b" : "#e5e7eb",
            }}
          >
            ★
          </span>
        ))}
        <span style={{ ...smallText, marginLeft: 4 }}>
          {value.toFixed(1)} ({totalRatings})
        </span>
      </div>
    );
  }

  function sellerBadges() {
    if (!totalRatings || !avgRating) return null;

    const badges: string[] = [];

    if (totalRatings < 3) {
      badges.push("Novo na comunidade");
    } else if (totalRatings >= 3 && totalRatings < 10) {
      badges.push("Vendedor em crescimento");
    }

    if (totalRatings >= 10 && avgRating >= 4.5) {
      badges.push("Vendedor confiável");
    }

    if (!badges.length) return null;

    return (
      <div style={badgeRow}>
        {badges.map((b) => (
          <span key={b} style={badgeStyle}>
            {b}
          </span>
        ))}
      </div>
    );
  }

  async function handleSaveRating(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userId) {
      setError("Precisas de entrar para deixar uma avaliação.");
      return;
    }

    if (!myRating) {
      setError("Escolhe uma classificação entre 1 e 5 estrelas.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("ad_ratings")
        .upsert(
          {
            ad_id: adId,
            seller_id: ownerId,
            rater_id: userId,
            rating: myRating,
            comment: myComment || null,
          },
          { onConflict: "ad_id,rater_id" }
        );

      if (error) {
        console.error(error);
        setError("Não foi possível guardar a avaliação.");
        return;
      }

      // Recarrega médias
      const { data, error: reloadError } = await supabase
        .from("ad_ratings")
        .select("*")
        .eq("ad_id", adId);

      if (!reloadError && data) {
        const rows = data as RatingRow[];
        const sum = rows.reduce((acc, r) => acc + (r.rating ?? 0), 0);
        setAvgRating(rows.length ? sum / rows.length : null);
        setTotalRatings(rows.length);
      }

      setSuccess("Avaliação guardada com sucesso.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendReport(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userId) {
      setError("Precisas de entrar para reportar um anúncio.");
      return;
    }

    if (!reportReason.trim()) {
      setError("Indica pelo menos o motivo principal.");
      return;
    }

    try {
      setReportSaving(true);

      const { error } = await supabase.from("ad_reports").insert([
        {
          ad_id: adId,
          reported_user_id: ownerId,
          reporter_id: userId,
          reason: reportReason.trim(),
          details: reportDetails.trim() || null,
        },
      ]);

      if (error) {
        console.error(error);
        setError("Não foi possível enviar o reporte.");
        return;
      }

      setSuccess("Reporte enviado para análise. Obrigado por ajudares na moderação.");
      setReportOpen(false);
      setReportReason("");
      setReportDetails("");
    } finally {
      setReportSaving(false);
    }
  }

  const isOwner = userId && userId === ownerId;

  return (
    <>
      <section style={cardStyle}>
        <h2 style={titleStyle}>Avaliações & reputação</h2>

        {loading ? (
          <p style={smallText}>A carregar dados de avaliações…</p>
        ) : (
          <>
            {avgRating && totalRatings > 0 ? (
              <>
                <p style={smallText}>Classificação média deste anúncio:</p>
                {renderStarsReadOnly(avgRating)}
              </>
            ) : (
              <p style={smallText}>
                Ainda não há avaliações para este anúncio. Sê a primeira pessoa a partilhar a tua
                experiência.
              </p>
            )}

            {sellerBadges()}

            {!isOwner && (
              <form onSubmit={handleSaveRating} style={formRow}>
                <div>
                  <p style={{ ...smallText, marginBottom: 4 }}>
                    A tua avaliação ao vendedor / negócio:
                  </p>
                  {renderStarsInteractive(myRating, (v) => setMyRating(v))}
                </div>

                <div>
                  <textarea
                    style={textareaStyle}
                    placeholder="Comentário opcional (entrega, estado do item, comunicação…) "
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                  />
                </div>

                <div style={buttonRow}>
                  <button
                    type="submit"
                    style={saving ? { ...primaryButton, opacity: 0.7, cursor: "default" } : primaryButton}
                    disabled={saving}
                  >
                    {saving ? "A guardar…" : "Guardar avaliação"}
                  </button>

                  <button
                    type="button"
                    style={secondaryButton}
                    onClick={() => setReportOpen(true)}
                  >
                    Reportar anúncio
                  </button>
                </div>

                {error && <p style={errorText}>{error}</p>}
                {success && <p style={successText}>{success}</p>}
              </form>
            )}

            {isOwner && (
              <p style={{ ...smallText, marginTop: 8 }}>
                És a pessoa que criou este anúncio. As avaliações são dadas por quem faz negócios
                contigo.
              </p>
            )}
          </>
        )}
      </section>

      {reportOpen && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={titleStyle}>Reportar anúncio</h3>
            <p style={smallText}>
              Usa esta opção apenas para situações que violem as regras da plataforma (fraude,
              conteúdo impróprio, etc.). O reporte é enviado para os administradores.
            </p>

            <form onSubmit={handleSendReport} style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <label style={{ ...smallText, display: "block", marginBottom: 4 }}>
                  Motivo principal
                </label>
                <input
                  type="text"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    padding: "6px 8px",
                    fontSize: 13,
                  }}
                  placeholder="Ex.: suspeita de fraude, conteúdo inadequado…"
                />
              </div>

              <div>
                <label style={{ ...smallText, display: "block", marginBottom: 4 }}>
                  Detalhes adicionais (opcional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  style={textareaStyle}
                  placeholder="Conta-nos o que aconteceu para a equipa poder analisar melhor."
                />
              </div>

              <div style={buttonRow}>
                <button
                  type="button"
                  style={secondaryButton}
                  onClick={() => setReportOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={
                    reportSaving ? { ...primaryButton, opacity: 0.7, cursor: "default" } : primaryButton
                  }
                  disabled={reportSaving}
                >
                  {reportSaving ? "A enviar…" : "Enviar reporte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
