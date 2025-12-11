"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type InterestedBuyer = {
  id: string;
  nome: string | null;
  email: string | null;
};

export type VendaStatus = "disponivel" | "reservado" | "vendido" | null;

type Props = {
  /** ID do anúncio (coluna anuncios.id) */
  adId: number;
  /** Organização do anúncio (coluna anuncios.org_id) – pode ser null */
  orgId: number | null;
  /** Dono do anúncio (vendedor) – id do utilizador */
  sellerId: string;
  /** Utilizador logado (para garantir que só o dono mexe) */
  currentUserId: string;
  /** Estado atual do campo anuncios.venda_status */
  currentStatus: VendaStatus;
  /** Callback opcional quando o status muda */
  onStatusChanged?: (status: VendaStatus) => void;
};

export default function VendaStatusControls({
  adId,
  orgId,
  sellerId,
  currentUserId,
  currentStatus,
  onStatusChanged,
}: Props) {
  const [status, setStatus] = useState<VendaStatus>(currentStatus);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [interessados, setInteressados] = useState<InterestedBuyer[]>([]);
  const [loadingInteressados, setLoadingInteressados] = useState(false);
  const [interessadosError, setInteressadosError] = useState<string | null>(
    null
  );
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null);

  const isOwner = currentUserId === sellerId;

  /* --------------------------------------------------
   *  Carregar lista de interessados quando abrir modal
   * -------------------------------------------------- */
  useEffect(() => {
    if (!modalOpen || !isOwner) return;

    async function loadInteressados() {
      setLoadingInteressados(true);
      setInteressadosError(null);

      try {
        // Todas as mensagens sobre ESTE anúncio onde o vendedor participa
        const { data: msgs, error: msgsError } = await supabase
          .from("chat_messages")
          .select("sender_id, receiver_id")
          .eq("ad_id", adId)
          .or(`sender_id.eq.${sellerId},receiver_id.eq.${sellerId}`);

        if (msgsError) throw msgsError;

        const ids = new Set<string>();
        (msgs ?? []).forEach((m: any) => {
          if (m.sender_id && m.sender_id !== sellerId) ids.add(m.sender_id);
          if (m.receiver_id && m.receiver_id !== sellerId)
            ids.add(m.receiver_id);
        });

        if (ids.size === 0) {
          setInteressados([]);
          return;
        }

        // Só usamos nome + email; nada de full_name
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, nome, email")
          .in("id", Array.from(ids));

        if (profilesError) throw profilesError;

        const list: InterestedBuyer[] = (profiles ?? []).map((p: any) => ({
          id: p.id,
          nome: p.nome ?? null,
          email: p.email ?? null,
        }));

        setInteressados(list);
      } catch (err: any) {
        console.error(err);
        setInteressadosError(
          "Não foi possível carregar perfis dos interessados."
        );
      } finally {
        setLoadingInteressados(false);
      }
    }

    loadInteressados();
  }, [modalOpen, adId, sellerId, isOwner]);

  /* ------------------------
   *  Helpers de atualização
   * ------------------------ */

  async function updateStatusInDb(newStatus: VendaStatus) {
    setLoadingStatus(true);
    try {
      const { error } = await supabase
        .from("anuncios")
        .update({ venda_status: newStatus })
        .eq("id", adId);

      if (error) throw error;

      setStatus(newStatus);
      onStatusChanged?.(newStatus);
    } finally {
      setLoadingStatus(false);
    }
  }

  /* -----------------------------
   *  Ações dos botões principais
   * ----------------------------- */

  async function handleSetDisponivel() {
    if (!isOwner) return;
    await updateStatusInDb("disponivel");
  }

  async function handleSetReservado() {
    if (!isOwner) return;
    await updateStatusInDb("reservado");
  }

  // Abre modal para escolher comprador
  function handleOpenVendidaModal() {
    if (!isOwner) return;
    setModalOpen(true);
  }

  async function handleVendidoSemComprador() {
    if (!isOwner) return;
    await updateStatusInDb("vendido");
    setModalOpen(false);
  }

  /* -----------------------------------
   *  Confirmar comprador + criar review
   * ----------------------------------- */

  async function handleConfirmarComprador() {
    if (!isOwner || !selectedBuyerId) return;

    setLoadingStatus(true);
    try {
      // 1) Marca o anúncio como vendido
      const { error: updErr } = await supabase
        .from("anuncios")
        .update({ venda_status: "vendido" })
        .eq("id", adId);

      if (updErr) throw updErr;

      // 2) Cria registo em ad_reviews (pendente)
      const { error: reviewErr } = await supabase.from("ad_reviews").insert({
        ad_id: adId,
        org_id: orgId,
        seller_id: sellerId,
        buyer_id: selectedBuyerId,
        status: "pending",
      });

      if (reviewErr) throw reviewErr;

      setStatus("vendido");
      onStatusChanged?.("vendido");
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(
        "Não foi possível registar a avaliação pendente. Verifica a tabela ad_reviews."
      );
    } finally {
      setLoadingStatus(false);
    }
  }

  /* -------------
   *  Render
   * ------------- */

  return (
    <>
      {/* BOTÕES DE STATUS */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={handleSetDisponivel}
          disabled={!isOwner || loadingStatus}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border:
              status === "disponivel" ? "2px solid #16a34a" : "1px solid #e5e7eb",
            backgroundColor: status === "disponivel" ? "#dcfce7" : "#ffffff",
            fontSize: 12,
            cursor: !isOwner || loadingStatus ? "default" : "pointer",
          }}
        >
          Disponível
        </button>

        <button
          type="button"
          onClick={handleSetReservado}
          disabled={!isOwner || loadingStatus}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border:
              status === "reservado" ? "2px solid #fb923c" : "1px solid #e5e7eb",
            backgroundColor: status === "reservado" ? "#ffedd5" : "#ffffff",
            fontSize: 12,
            cursor: !isOwner || loadingStatus ? "default" : "pointer",
          }}
        >
          Reservado
        </button>

        <button
          type="button"
          onClick={handleOpenVendidaModal}
          disabled={!isOwner || loadingStatus}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border:
              status === "vendido" ? "2px solid #b91c1c" : "1px solid #e5e7eb",
            backgroundColor: status === "vendido" ? "#fee2e2" : "#ffffff",
            fontSize: 12,
            cursor: !isOwner || loadingStatus ? "default" : "pointer",
          }}
        >
          Vendi este item
        </button>
      </div>

      {/* MODAL DE ESCOLHA DO COMPRADOR */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              backgroundColor: "#ffffff",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 20px 60px rgba(15,23,42,0.35)",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Para quem vendeste este item?
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "#4b5563",
                marginBottom: 10,
              }}
            >
              Escolhe a pessoa com quem fechaste o negócio. Vamos criar uma
              avaliação pendente apenas para essa pessoa, na página
              &nbsp;<strong>“Avaliações”</strong>.
            </p>

            {interessadosError && (
              <p
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#b91c1c",
                  fontSize: 13,
                  padding: "6px 10px",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                {interessadosError}
              </p>
            )}

            {loadingInteressados ? (
              <p
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  marginTop: 8,
                }}
              >
                A carregar perfis dos interessados…
              </p>
            ) : interessados.length === 0 ? (
              <p
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  marginTop: 8,
                }}
              >
                Ainda não encontrámos ninguém nas conversas deste anúncio.
                Podes marcar como vendido sem avaliação, se quiseres.
              </p>
            ) : (
              <div
                style={{
                  marginTop: 8,
                  maxHeight: 220,
                  overflowY: "auto",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              >
                {interessados.map((p) => {
                  const isSelected = selectedBuyerId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedBuyerId(p.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        border: "none",
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: isSelected ? "#ecfdf5" : "#ffffff",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 2,
                          color: "#111827",
                        }}
                      >
                        {p.nome || p.email || "Utilizador"}
                      </div>
                      {p.email && (
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          {p.email}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={loadingStatus}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "8px 10px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  fontSize: 13,
                  cursor: loadingStatus ? "default" : "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleVendidoSemComprador}
                disabled={loadingStatus}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "8px 10px",
                  borderRadius: 999,
                  border: "none",
                  backgroundColor: "#f97316",
                  color: "#ffffff",
                  fontSize: 13,
                  cursor: loadingStatus ? "default" : "pointer",
                }}
              >
                Vendi sem comprador
              </button>

              <button
                type="button"
                onClick={handleConfirmarComprador}
                disabled={!selectedBuyerId || loadingStatus}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "8px 10px",
                  borderRadius: 999,
                  border: "none",
                  backgroundImage:
                    "linear-gradient(90deg, #16a34a, #22c55e)",
                  color: "#ffffff",
                  fontSize: 13,
                  cursor:
                    !selectedBuyerId || loadingStatus ? "default" : "pointer",
                }}
              >
                Confirmar comprador
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
