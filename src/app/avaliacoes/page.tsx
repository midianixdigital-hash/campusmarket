"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ReviewRow = {
  id: number;
  ad_id: number;
  rating: number | null;
  comment: string | null;
  status: "pending" | "submitted";
  created_at: string;
};

type PendingReview = {
  id: number;
  ad_id: number;
  ad_title: string;
  created_at: string;
};

type DoneReview = {
  id: number;
  ad_id: number;
  ad_title: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

/** ESTILOS **/

const pageWrapper: CSSProperties = {
  maxWidth: 1120,
  margin: "24px auto",
  padding: "16px",
};

const titleStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 4,
};

const subtitleStyle: CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 16,
};

const cardStyle: CSSProperties = {
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

const mutedText: CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 13,
  resize: "vertical",
};

const buttonStyle: CSSProperties = {
  border: "none",
  borderRadius: 999,
  padding: "8px 14px",
  backgroundColor: "#047857",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const buttonGhost: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#ffffff",
  color: "#047857",
  border: "1px solid #047857",
};

export default function AvaliacoesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [pending, setPending] = useState<PendingReview[]>([]);
  const [done, setDone] = useState<DoneReview[]>([]);

  const [sendingId, setSendingId] = useState<number | null>(null);
  const [ratingValue, setRatingValue] = useState<Record<number, number>>({});
  const [ratingComment, setRatingComment] = useState<Record<number, string>>(
    {}
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) console.error(error);

      if (!user) {
        router.replace("/login");
        return;
      }

      setCurrentUserId(user.id);
      await loadData(user.id);
      setLoading(false);
    })();
  }, [router]);

  async function loadData(userId: string) {
    setError(null);
    setSuccess(null);

    // 1) buscar reviews onde este utilizador é o comprador
    const { data: reviewsData, error: reviewsError } = await supabase
      .from("ad_reviews")
      .select("id, ad_id, rating, comment, status, created_at")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });

    if (reviewsError) {
      console.error(reviewsError);
      setError("Não foi possível carregar as avaliações.");
      return;
    }

    const rows: ReviewRow[] = (reviewsData ?? []) as ReviewRow[];

    if (rows.length === 0) {
      setPending([]);
      setDone([]);
      return;
    }

    // 2) buscar títulos dos anúncios envolvidos
    const adIds = Array.from(new Set(rows.map((r) => r.ad_id)));

    const { data: adsData, error: adsError } = await supabase
      .from("anuncios")
      .select("id, titulo")
      .in("id", adIds);

    if (adsError) {
      console.error(adsError);
    }

    const titleMap = new Map<number, string>();
    (adsData ?? []).forEach((ad: any) => {
      titleMap.set(ad.id, ad.titulo ?? `Anúncio #${ad.id}`);
    });

    const pendingReviews: PendingReview[] = [];
    const doneReviews: DoneReview[] = [];

    rows.forEach((r) => {
      const title = titleMap.get(r.ad_id) ?? `Anúncio #${r.ad_id}`;
      if (r.status === "pending") {
        pendingReviews.push({
          id: r.id,
          ad_id: r.ad_id,
          ad_title: title,
          created_at: r.created_at,
        });
      } else if (r.status === "submitted" && r.rating !== null) {
        doneReviews.push({
          id: r.id,
          ad_id: r.ad_id,
          ad_title: title,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
        });
      }
    });

    setPending(pendingReviews);
    setDone(doneReviews);
  }

  async function handleSubmitRating(
    e: FormEvent,
    review: PendingReview
  ) {
    e.preventDefault();
    if (!currentUserId) return;

    const value = ratingValue[review.id];
    const comment = ratingComment[review.id] ?? "";

    if (!value || value < 1 || value > 5) {
      setError("Escolhe uma avaliação de 1 a 5 estrelas.");
      return;
    }

    setSendingId(review.id);
    setError(null);
    setSuccess(null);

    try {
      const { error: updError } = await supabase
        .from("ad_reviews")
        .update({
          rating: value,
          comment: comment.trim() || null,
          status: "submitted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", review.id);

      if (updError) {
        console.error(updError);
        setError("Não foi possível guardar a avaliação.");
        return;
      }

      setSuccess("Avaliação enviada. Obrigado!");
      await loadData(currentUserId);

      setRatingValue((prev) => {
        const copy = { ...prev };
        delete copy[review.id];
        return copy;
      });
      setRatingComment((prev) => {
        const copy = { ...prev };
        delete copy[review.id];
        return copy;
      });
    } finally {
      setSendingId(null);
    }
  }

  if (loading) {
    return (
      <main style={pageWrapper}>
        <p style={mutedText}>A carregar…</p>
      </main>
    );
  }

  return (
    <main style={pageWrapper}>
      <h1 style={titleStyle}>Avaliações & reputação</h1>
      <p style={subtitleStyle}>
        Aqui encontras as avaliações pendentes das tuas compras e o histórico
        de avaliações que já fizeste como compradora.
      </p>

      {error && <p style={{ ...mutedText, color: "#b91c1c" }}>{error}</p>}
      {success && (
        <p style={{ ...mutedText, color: "#16a34a" }}>{success}</p>
      )}

      {/* PENDENTES */}
      <section style={{ ...cardStyle, marginTop: 16 }}>
        <h2 style={sectionTitle}>Avaliações pendentes</h2>

        {pending.length === 0 ? (
          <p style={mutedText}>
            Neste momento não tens nenhuma avaliação pendente. Quando comprares
            algo e o vendedor marcar o anúncio como &quot;vendido&quot;,
            a avaliação aparece aqui.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {pending.map((rev) => (
              <div
                key={rev.id}
                style={{
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  padding: 12,
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 2,
                  }}
                >
                  {rev.ad_title}
                </p>
                <p style={mutedText}>
                  Venda registada em{" "}
                  {new Date(rev.created_at).toLocaleDateString("pt-PT")}
                </p>

                <form
                  onSubmit={(e) => handleSubmitRating(e, rev)}
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={mutedText}>Avaliação:</span>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setRatingValue((prev) => ({
                            ...prev,
                            [rev.id]: n,
                          }))
                        }
                        style={{
                          ...buttonGhost,
                          padding: "4px 8px",
                          fontSize: 12,
                          backgroundColor:
                            ratingValue[rev.id] === n
                              ? "#047857"
                              : "#ffffff",
                          color:
                            ratingValue[rev.id] === n
                              ? "#ffffff"
                              : "#047857",
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <textarea
                    style={inputStyle}
                    placeholder="Conta rapidamente como correu a experiência (opcional)…"
                    value={ratingComment[rev.id] ?? ""}
                    onChange={(e) =>
                      setRatingComment((prev) => ({
                        ...prev,
                        [rev.id]: e.target.value,
                      }))
                    }
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="submit"
                      style={buttonStyle}
                      disabled={sendingId === rev.id}
                    >
                      {sendingId === rev.id
                        ? "A enviar…"
                        : "Enviar avaliação"}
                    </button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* JÁ FEITAS */}
      <section style={{ ...cardStyle, marginTop: 16 }}>
        <h2 style={sectionTitle}>Avaliações que já fizeste</h2>

        {done.length === 0 ? (
          <p style={mutedText}>
            Ainda não fizeste nenhuma avaliação. Assim que avaliares uma compra,
            ela aparece aqui.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {done.map((r) => (
              <div
                key={r.id}
                style={{
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  padding: 10,
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {r.ad_title}
                </p>
                <p style={mutedText}>
                  {r.rating} / 5 ·{" "}
                  {new Date(r.created_at).toLocaleDateString("pt-PT")}
                </p>
                {r.comment && (
                  <p
                    style={{
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {r.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
