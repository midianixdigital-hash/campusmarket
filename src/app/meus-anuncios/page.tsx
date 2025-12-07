"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Ad = {
  id: number;
  titulo: string;
  preco: number | null;
  status: string | null;
  criado_em: string | null; // <- coluna certa na DB
};

type ChatRow = {
  ad_id: number;
  sender_id: string;
  receiver_id: string;
  created_at: string;
};

type AdWithStats = Ad & {
  interessados: number;      // nº de utilizadores diferentes que falaram
  hasNewMessages: boolean;   // se a última msg de alguém foi do outro lado
};

const pageWrapper: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "24px auto",
  padding: "0 16px",
};

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 8,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 20,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 14,
  boxShadow: "0 1px 4px rgba(15,23,42,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const adTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
};

const priceStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "#111827",
};

const metaRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 12,
  color: "#6b7280",
};

const badgeRow: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  marginTop: 4,
};

const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  padding: "3px 8px",
  borderRadius: 999,
  backgroundColor: "#e5e7eb",
  color: "#374151",
};

const badgeAlertStyle: React.CSSProperties = {
  ...badgeStyle,
  backgroundColor: "#f97316",
  color: "#111827",
  fontWeight: 600,
};

const linkRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 8,
  fontSize: 12,
};

const smallLink: React.CSSProperties = {
  color: "#1d4ed8",
  textDecoration: "none",
};

export default function MeusAnunciosPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [ads, setAds] = useState<AdWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  // 1) garantir que há sessão
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
    })();
  }, [router]);

  // 2) carregar anúncios do utilizador + stats de mensagens
  async function loadData(currentUserId: string) {
    setLoading(true);

    try {
      // anúncios deste utilizador
      const { data: adsData, error: adsError } = await supabase
        .from("anuncios")
        .select("id, titulo, preco, status, criado_em")
        .eq("owner_id", currentUserId)
        .order("criado_em", { ascending: false });

      if (adsError || !adsData) {
        console.error(adsError);
        setAds([]);
        return;
      }

      const adsTyped = adsData as Ad[];

      // mensagens em que ele está envolvido
      const { data: msgsData, error: msgsError } = await supabase
        .from("chat_messages")
        .select("ad_id, sender_id, receiver_id, created_at")
        .or(
          `sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`
        );

      if (msgsError || !msgsData) {
        console.error(msgsError);
        // mesmo se der erro nas mensagens, mostramos os anúncios
        setAds(
          adsTyped.map((ad) => ({
            ...ad,
            interessados: 0,
            hasNewMessages: false,
          }))
        );
        return;
      }

      const msgs = msgsData as ChatRow[];

      // mapa: ad_id -> { outros_utilizadores, hasNewMessages }
      const statsMap = new Map<
        number,
        { others: Set<string>; hasNew: boolean }
      >();

      for (const row of msgs) {
        const isSenderMe = row.sender_id === currentUserId;
        const otherId = isSenderMe ? row.receiver_id : row.sender_id;

        if (!statsMap.has(row.ad_id)) {
          statsMap.set(row.ad_id, {
            others: new Set<string>(),
            hasNew: false,
          });
        }

        const entry = statsMap.get(row.ad_id)!;
        entry.others.add(otherId);

        // “mensagem nova” se a última mensagem veio do outro lado
        if (!isSenderMe) {
          entry.hasNew = true;
        }
        if (isSenderMe) {
          entry.hasNew = false;
        }
      }

      const withStats: AdWithStats[] = adsTyped.map((ad) => {
        const stat = statsMap.get(ad.id);
        return {
          ...ad,
          interessados: stat ? stat.others.size : 0,
          hasNewMessages: stat ? stat.hasNew : false,
        };
      });

      setAds(withStats);
    } finally {
      setLoading(false);
    }
  }

  // 3) sempre que tiver userId, carregar dados
  useEffect(() => {
    if (!userId) return;
    loadData(userId);
  }, [userId]);

  // 4) realtime: se chegar mensagem nova para mim, recarrega stats
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("meus-anuncios-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          loadData(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <main style={pageWrapper}>
      <h1 style={titleStyle}>Meus anúncios</h1>
      <p style={subtitleStyle}>
        Vê rapidamente quais anúncios têm interessados e se há mensagens
        novas para responder.
      </p>

      {loading && <p style={{ fontSize: 14 }}>A carregar…</p>}

      {!loading && ads.length === 0 && (
        <p style={{ fontSize: 14 }}>
          Ainda não tens anúncios publicados.{" "}
          <Link href="/novo-anuncio" style={{ color: "#1d4ed8" }}>
            Criar primeiro anúncio
          </Link>
          .
        </p>
      )}

      {!loading && ads.length > 0 && (
        <section style={gridStyle}>
          {ads.map((ad) => {
            const createdDate =
              ad.criado_em != null
                ? new Date(ad.criado_em).toLocaleDateString("pt-PT")
                : "";

            const statusLabel = ad.status ?? "approved";

            return (
              <article key={ad.id} style={cardStyle}>
                <div style={adTitleStyle}>{ad.titulo}</div>

                <div style={metaRow}>
                  <span style={priceStyle}>
                    {ad.preco != null ? `${ad.preco} €` : "Preço a combinar"}
                  </span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    {statusLabel}
                  </span>
                </div>

                <div style={metaRow}>
                  <span>
                    {createdDate
                      ? `Publicado em ${createdDate}`
                      : "Data desconhecida"}
                  </span>
                </div>

                <div style={badgeRow}>
                  <span style={badgeStyle}>
                    {ad.interessados === 0 && "Nenhum interessado ainda"}
                    {ad.interessados === 1 && "1 interessado"}
                    {ad.interessados > 1 &&
                      `${ad.interessados} interessados`}
                  </span>

                  {ad.hasNewMessages && (
                    <span style={badgeAlertStyle}>
                      Mensagem nova neste anúncio
                    </span>
                  )}
                </div>

                <div style={linkRow}>
                  <Link href={`/anuncio/${ad.id}`} style={smallLink}>
                    Ver anúncio
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
