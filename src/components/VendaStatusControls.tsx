"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type VendaStatus = "disponivel" | "reservado" | "vendido";

type Props = {
  adId: number;
  ownerId: string;
  initialStatus: VendaStatus;
};

type BuyerOption = {
  id: string;
  name: string;
  email: string | null;
};

/** ESTILOS BÁSICOS **/

const containerStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const badgeBase: CSSProperties = {
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 600,
};

const statusBadgeDisponivel: CSSProperties = {
  ...badgeBase,
  backgroundColor: "#dcfce7",
  color: "#166534",
};

const statusBadgeReservado: CSSProperties = {
  ...badgeBase,
  backgroundColor: "#fef9c3",
  color: "#92400e",
};

const statusBadgeVendido: CSSProperties = {
  ...badgeBase,
  backgroundColor: "#fee2e2",
  color: "#b91c1c",
};

const pillButton: CSSProperties = {
  borderRadius: 999,
  padding: "4px 10px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#ffffff",
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
};

const pillButtonActive: CSSProperties = {
  ...pillButton,
  backgroundColor: "#047857",
  borderColor: "#047857",
  color: "#ffffff",
};

const tinyText: CSSProperties = {
  fontSize: 11,
  color: "#6b7280",
};

const modalOverlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15,23,42,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 40,
};

const modalCard: CSSProperties = {
  width: "100%",
  maxWidth: 420,
  backgroundColor: "#ffffff",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 20px 40px rgba(15,23,42,0.35)",
};

const modalTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 4,
};

const modalSubtitle: CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 10,
};

const buyersList: CSSProperties = {
  maxHeight: 200,
  overflowY: "auto",
  marginBottom: 10,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  padding: 6,
};

const buyerRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: 6,
  borderRadius: 8,
  cursor: "pointer",
};

const buyerRowSelected: CSSProperties = {
  ...buyerRow,
  backgroundColor: "#ecfdf5",
  border: "1px solid #bbf7d0",
};

const radioDotOuter: CSSProperties = {
  width: 16,
  height: 16,
  borderRadius: "999px",
  border: "2px solid #9ca3af",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const radioDotInner: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "999px",
  backgroundColor: "#047857",
};

const modalButtonsRow: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 4,
};

const ghostButton: CSSProperties = {
  borderRadius: 999,
  padding: "6px 12px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#ffffff",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
};

const primaryButton: CSSProperties = {
  ...ghostButton,
  borderColor: "#047857",
  backgroundColor: "#047857",
  color: "#ffffff",
};

const dangerButton: CSSProperties = {
  ...ghostButton,
  borderColor: "#b91c1c",
  color: "#b91c1c",
};

const errorText: CSSProperties = {
  fontSize: 12,
  color: "#b91c1c",
  marginTop: 4,
};

function getStatusBadge(status: VendaStatus) {
  if (status === "disponivel") {
    return <span style={statusBadgeDisponivel}>Disponível</span>;
  }
  if (status === "reservado") {
    return <span style={statusBadgeReservado}>Reservado</span>;
  }
  return <span style={statusBadgeVendido}>Vendido</span>;
}

export function VendaStatusControls({ adId, ownerId, initialStatus }: Props) {
  const [status, setStatus] = useState<VendaStatus>(initialStatus);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);

  // modal de escolha do comprador
  const [showModal, setShowModal] = useState(false);
  const [buyers, setBuyers] = useState<BuyerOption[]>([]);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Descobrir se o utilizador logado é o dono do anúncio
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.id === ownerId) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
    })();
  }, [ownerId]);

  // Carregar potenciais compradores (quem já falou no chat desse anúncio)
  async function loadPotentialBuyers() {
    setBuyersLoading(true);
    setError(null);

    try {
      const { data: msgs, error: msgsError } = await supabase
        .from("chat_messages")
        .select("sender_id, receiver_id")
        .eq("ad_id", adId);

      if (msgsError) {
        console.error(msgsError);
        setError("Não foi possível carregar os interessados.");
        setBuyersLoading(false);
        return;
      }

      const ids = new Set<string>();

      (msgs ?? []).forEach((m: any) => {
        if (m.sender_id && m.sender_id !== ownerId) {
          ids.add(m.sender_id);
        }
        if (m.receiver_id && m.receiver_id !== ownerId) {
          ids.add(m.receiver_id);
        }
      });

      const uniqueIds = Array.from(ids);

      if (uniqueIds.length === 0) {
        setBuyers([]);
        setBuyersLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, full_name, email")
        .in("id", uniqueIds);

      if (profilesError) {
        console.error(profilesError);
        setError("Não foi possível carregar perfis dos interessados.");
        setBuyersLoading(false);
        return;
      }

      const options: BuyerOption[] = (profiles ?? []).map((p: any) => ({
        id: p.id,
        name:
          p.full_name ||
          p.nome ||
          p.email ||
          "Pessoa sem nome configurado",
        email: p.email ?? null,
      }));

      setBuyers(options);
    } finally {
      setBuyersLoading(false);
    }
  }

  // Quando o dono do anúncio clica para mudar o status
  async function handleChangeStatus(newStatus: VendaStatus) {
    if (!isOwner) return;
    setError(null);

    // se apenas mudar entre disponível e reservado -> update direto
    if (newStatus === "disponivel" || newStatus === "reservado") {
      setLoading(true);
      try {
        const { error: updError } = await supabase
          .from("anuncios")
          .update({
            venda_status: newStatus,
            buyer_id: null, // limpa eventual comprador
          })
          .eq("id", adId);

        if (updError) {
          console.error(updError);
          setError("Não foi possível atualizar o estado da venda.");
          return;
        }

        setStatus(newStatus);
      } finally {
        setLoading(false);
      }
      return;
    }

    // se escolher "vendido", abrimos o modal para escolher o comprador
    setShowModal(true);
    if (buyers.length === 0) {
      await loadPotentialBuyers();
    }
  }

  // Confirmar comprador -> marcar como vendido + criar review pendente
  async function handleConfirmBuyer() {
    if (!selectedBuyerId) {
      setError("Escolhe para quem vendeste o item.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1) atualizar o anúncio
      const { error: updError } = await supabase
        .from("anuncios")
        .update({
          venda_status: "vendido",
          buyer_id: selectedBuyerId,
        })
        .eq("id", adId);

      if (updError) {
        console.error(updError);
        setError("Não foi possível marcar o anúncio como vendido.");
        setLoading(false);
        return;
      }

      // 2) criar registo de review pendente para o comprador
      const { error: reviewError } = await supabase.from("ad_reviews").insert([
        {
          ad_id: adId,
          seller_id: ownerId,
          buyer_id: selectedBuyerId,
          status: "pending",
        },
      ]);

      if (reviewError) {
        console.error(reviewError);
        // não bloqueio a venda, mas aviso
        setError("Venda registada, mas não foi possível criar a avaliação.");
      }

      setStatus("vendido");
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  }

  // Opção: marcar como vendido mesmo sem escolher comprador (sem avaliação)
  async function handleMarkSoldWithoutBuyer() {
    setLoading(true);
    setError(null);

    try {
      const { error: updError } = await supabase
        .from("anuncios")
        .update({
          venda_status: "vendido",
          buyer_id: null,
        })
        .eq("id", adId);

      if (updError) {
        console.error(updError);
        setError("Não foi possível marcar como vendido.");
        setLoading(false);
        return;
      }

      setStatus("vendido");
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  }

  // Se não é o dono, mostramos só o badge de leitura
  if (!isOwner) {
    return (
      <div style={containerStyle}>
        {getStatusBadge(status)}
      </div>
    );
  }

  // Dono do anúncio: controlo interativo
  return (
    <>
      <div style={containerStyle}>
        {getStatusBadge(status)}

        <span style={tinyText}>Mudar estado:</span>

        <button
          type="button"
          style={
            status === "disponivel" ? pillButtonActive : pillButton
          }
          onClick={() => handleChangeStatus("disponivel")}
          disabled={loading}
        >
          Disponível
        </button>
        <button
          type="button"
          style={
            status === "reservado" ? pillButtonActive : pillButton
          }
          onClick={() => handleChangeStatus("reservado")}
          disabled={loading}
        >
          Reservado
        </button>
        <button
          type="button"
          style={status === "vendido" ? pillButtonActive : pillButton}
          onClick={() => handleChangeStatus("vendido")}
          disabled={loading}
        >
          Vendido
        </button>

        {loading && (
          <span style={tinyText}>A guardar…</span>
        )}

        {error && (
          <span style={errorText}>{error}</span>
        )}
      </div>

      {showModal && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={modalTitle}>Para quem vendeste este item?</h3>
            <p style={modalSubtitle}>
              Escolhe a pessoa que efetivamente comprou. Isso vai criar uma
              avaliação pendente apenas para essa pessoa, na página
              &quot;Avaliações&quot;.
            </p>

            {buyersLoading ? (
              <p style={tinyText}>A carregar interessados…</p>
            ) : buyers.length === 0 ? (
              <p style={tinyText}>
                Ainda não encontrei ninguém nas conversas deste anúncio.
                Podes marcar como vendido sem avaliação, se quiseres.
              </p>
            ) : (
              <div style={buyersList}>
                {buyers.map((b) => {
                  const selected = b.id === selectedBuyerId;
                  return (
                    <div
                      key={b.id}
                      style={selected ? buyerRowSelected : buyerRow}
                      onClick={() => setSelectedBuyerId(b.id)}
                    >
                      <div style={radioDotOuter}>
                        {selected && <div style={radioDotInner} />}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {b.name}
                        </div>
                        {b.email && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                            }}
                          >
                            {b.email}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {error && <p style={errorText}>{error}</p>}

            <div style={modalButtonsRow}>
              <button
                type="button"
                style={ghostButton}
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                  setSelectedBuyerId(null);
                }}
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                type="button"
                style={dangerButton}
                onClick={handleMarkSoldWithoutBuyer}
                disabled={loading}
              >
                Vendido sem comprador
              </button>

              <button
                type="button"
                style={primaryButton}
                onClick={handleConfirmBuyer}
                disabled={loading || buyersLoading || buyers.length === 0}
              >
                {loading ? "A guardar…" : "Confirmar comprador"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
