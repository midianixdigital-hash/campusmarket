"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";


type MessageRow = {
  id: number;
  ad_id: number;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  created_at: string;
  is_read: boolean;
};

type AdMeta = {
  id: number;
  titulo: string | null;
  preco: number | null;
};

type UserMeta = {
  id: string;
  nome: string | null;
  email: string | null;
};

type Conversation = {
  key: string; // `${adId}|${otherUserId}`
  adId: number;
  otherUserId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

function formatPrice(preco: number | null | undefined) {
  if (preco === null || preco === undefined) return "";
  return `${preco.toString()}€`;
}

function extractUserName(user: UserMeta | undefined | null) {
  if (!user) return "Utilizador";
  if (user.nome && user.nome.trim().length > 0) return user.nome;
  if (user.email && user.email.trim().length > 0) return user.email;
  return "Utilizador";
}

export default function MensagensPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [ads, setAds] = useState<Record<number, AdMeta>>({});
  const [users, setUsers] = useState<Record<string, UserMeta>>({});

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [searchText, setSearchText] = useState("");

  // -------------------------------------------------
  //  CARREGAR UTILIZADOR E CONVERSAS
  // -------------------------------------------------
  useEffect(() => {
    (async () => {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);
      }

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      // Todas as mensagens onde este user é sender OU receiver
      const { data: msgsData, error: msgsError } = await supabase
        .from("chat_messages")
        .select(
          "id, ad_id, sender_id, receiver_id, message, created_at, is_read"
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (msgsError) {
        console.error(msgsError);
        setConversations([]);
        setMessages([]);
        setLoading(false);
        return;
      }

      const msgs = (msgsData ?? []) as MessageRow[];

      // IDs de anúncios e outros utilizadores
      const adIds = new Set<number>();
      const otherUserIds = new Set<string>();

      for (const m of msgs) {
        if (m.ad_id) adIds.add(m.ad_id);
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (otherId) otherUserIds.add(otherId);
      }

      // Fetch anúncios
      let adsMap: Record<number, AdMeta> = {};
      if (adIds.size > 0) {
        const { data: adsData, error: adsError } = await supabase
          .from("anuncios")
          .select("id, titulo, preco")
          .in("id", Array.from(adIds));

        if (adsError) {
          console.error(adsError);
        } else {
          adsMap = {};
          for (const a of adsData ?? []) {
            adsMap[a.id] = {
              id: a.id,
              titulo: a.titulo ?? null,
              preco: a.preco ?? null,
            };
          }
        }
      }

      // Fetch perfis
      let usersMap: Record<string, UserMeta> = {};
      if (otherUserIds.size > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, nome, email")
          .in("id", Array.from(otherUserIds));

        if (usersError) {
          console.error(usersError);
        } else {
          usersMap = {};
          for (const u of usersData ?? []) {
            usersMap[u.id] = {
              id: u.id,
              nome: u.nome ?? null,
              email: u.email ?? null,
            };
          }
        }
      }

      setAds(adsMap);
      setUsers(usersMap);

      // Construir mapa de conversas a partir das mensagens
      const convMap = new Map<string, Conversation>();

      for (const m of msgs) {
        const otherUserId =
          m.sender_id === user.id ? m.receiver_id : m.sender_id;
        const key = `${m.ad_id}|${otherUserId}`;

        let conv = convMap.get(key);
        if (!conv) {
          conv = {
            key,
            adId: m.ad_id,
            otherUserId,
            lastMessage: m.message,
            lastMessageAt: m.created_at,
            unreadCount: 0,
          };
          convMap.set(key, conv);
        } else {
          // como as mensagens estão por ordem asc, a última sobrescreve
          conv.lastMessage = m.message;
          conv.lastMessageAt = m.created_at;
        }

        if (m.receiver_id === user.id && !m.is_read) {
          conv.unreadCount += 1;
        }
      }

      // Ver se veio da StartChatButton com adId & with
      const adIdParam = searchParams.get("adId");
      const withParam = searchParams.get("with");
      let defaultSelected: string | null = null;

      if (adIdParam && withParam && withParam !== user.id) {
        const adIdNum = Number(adIdParam);
        if (!Number.isNaN(adIdNum)) {
          const key = `${adIdNum}|${withParam}`;
          defaultSelected = key;

          if (!convMap.has(key)) {
            // conversa ainda não existe -> criar "placeholder"
            convMap.set(key, {
              key,
              adId: adIdNum,
              otherUserId: withParam,
              lastMessage: null,
              lastMessageAt: null,
              unreadCount: 0,
            });
          }
        }
      }

      let convs = Array.from(convMap.values());
      convs.sort((a, b) => {
        const tA = a.lastMessageAt ?? "";
        const tB = b.lastMessageAt ?? "";
        return tB.localeCompare(tA);
      });

      if (!defaultSelected && convs.length > 0) {
        defaultSelected = convs[0].key;
      }

      setConversations(convs);
      setSelectedKey(defaultSelected);

      setLoading(false);

      // se tiver conversa pré-selecionada, carrega as mensagens dela
      if (defaultSelected) {
        await loadMessagesForConversation(
          defaultSelected,
          user.id,
          convs,
          setMessages,
          setConversations
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------
  //  FUNÇÃO AUXILIAR: CARREGAR MENSAGENS + MARCAR COMO LIDAS
  // -------------------------------------------------
  async function loadMessagesForConversation(
    key: string,
    userId: string,
    convs: Conversation[],
    setMsgs: (msgs: MessageRow[]) => void,
    updateConvs: (fn: (prev: Conversation[]) => Conversation[]) => void
  ) {
    const conv = convs.find((c) => c.key === key);
    if (!conv) {
      setMsgs([]);
      return;
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .select(
        "id, ad_id, sender_id, receiver_id, message, created_at, is_read"
      )
      .eq("ad_id", conv.adId)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setMsgs([]);
      return;
    }

    let msgs = (data ?? []) as MessageRow[];

    // Marcar como lidas todas as mensagens onde ESTE user é receiver
    const hasUnreadForThisConv = msgs.some(
      (m) => m.receiver_id === userId && !m.is_read
    );

    if (hasUnreadForThisConv) {
      const { error: updateError } = await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("ad_id", conv.adId)
        .eq("receiver_id", userId)
        .eq("is_read", false);

      if (updateError) {
        console.error(updateError);
      } else {
        msgs = msgs.map((m) =>
          m.receiver_id === userId ? { ...m, is_read: true } : m
        );

        // Atualizar contador de não lidas na lista de conversas
        updateConvs((prev) =>
          prev.map((c) =>
            c.key === key ? { ...c, unreadCount: 0 } : c
          )
        );

        // Avisar o AppShell para atualizar a bolinha do ícone
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cm-messages-updated"));
        }
      }
    }

    setMsgs(msgs);
  }

  // -------------------------------------------------
  //  HANDLERS
  // -------------------------------------------------
  async function handleSelectConversation(key: string) {
    setSelectedKey(key);
    setNewMessageText("");

    if (!currentUserId) return;

    await loadMessagesForConversation(
      key,
      currentUserId,
      conversations,
      setMessages,
      (fn) => setConversations(fn(conversations))
    );
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!selectedKey || !currentUserId) return;

    const text = newMessageText.trim();
    if (!text) return;

    const conv = conversations.find((c) => c.key === selectedKey);
    if (!conv) return;

    setSending(true);

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          ad_id: conv.adId,
          sender_id: currentUserId,
          receiver_id: conv.otherUserId,
          message: text,
          is_read: false,
        })
        .select(
          "id, ad_id, sender_id, receiver_id, message, created_at, is_read"
        )
        .single();

      if (error) {
        console.error(error);
        alert("Não foi possível enviar a mensagem.");
        return;
      }

      const inserted = data as MessageRow;

      // adicionar à lista de mensagens
      setMessages((prev) => [...prev, inserted]);

      // atualizar conversa (última mensagem + data)
      setConversations((prev) =>
        prev
          .map((c) =>
            c.key === selectedKey
              ? {
                  ...c,
                  lastMessage: inserted.message,
                  lastMessageAt: inserted.created_at,
                }
              : c
          )
          .sort((a, b) => {
            const tA = a.lastMessageAt ?? "";
            const tB = b.lastMessageAt ?? "";
            return tB.localeCompare(tA);
          })
      );

      setNewMessageText("");

      // Avisar o AppShell para atualizar a bolinha para o OUTRO utilizador
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cm-messages-updated"));
      }
    } finally {
      setSending(false);
    }
  }

  // -------------------------------------------------
  //  DERIVADOS
  // -------------------------------------------------
  const selectedConversation = useMemo(
    () => conversations.find((c) => c.key === selectedKey) ?? null,
    [conversations, selectedKey]
  );

  const filteredConversations = useMemo(() => {
    if (!searchText.trim()) return conversations;

    const q = searchText.toLowerCase();

    return conversations.filter((c) => {
      const ad = ads[c.adId];
      const title = ad?.titulo ?? `Anúncio #${c.adId}`;
      const price = formatPrice(ad?.preco);
      const otherUser = users[c.otherUserId];
      const otherName = extractUserName(otherUser);

      const text = `${title} ${price} ${otherName}`.toLowerCase();
      return text.includes(q);
    });
  }, [ads, conversations, users, searchText]);

  // -------------------------------------------------
  //  UI
  // -------------------------------------------------

  if (loading) {
    return (
      <main
        style={{
          maxWidth: 1120,
          margin: "24px auto",
          padding: "16px",
          fontSize: 14,
        }}
      >
        <p>A carregar mensagens…</p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 1120,
        margin: "24px auto",
        padding: "16px",
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        Mensagens
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#6b7280",
          marginBottom: 16,
        }}
      >
        Conversas organizadas por anúncio e pessoa. Cada produto tem o seu
        próprio chat.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 2fr)",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {/* COLUNA ESQUERDA - LISTA DE CONVERSAS */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Conversas
          </h2>

          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Procurar por pessoa ou anúncio…"
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />

          {filteredConversations.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                marginTop: 4,
              }}
            >
              Ainda não tens conversas. Envia uma mensagem a partir de um
              anúncio para começar.
            </p>
          ) : (
            <div
              style={{
                marginTop: 4,
                overflowY: "auto",
                maxHeight: 420,
                paddingRight: 4,
              }}
            >
              {filteredConversations.map((c) => {
                const ad = ads[c.adId];
                const title = ad?.titulo ?? `Anúncio #${c.adId}`;
                const price = formatPrice(ad?.preco);
                const otherUser = users[c.otherUserId];
                const otherName = extractUserName(otherUser);
                const isSelected = c.key === selectedKey;
                const hasUnread = c.unreadCount > 0;

                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => handleSelectConversation(c.key)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      backgroundColor: isSelected
                        ? "#ecfdf3"
                        : hasUnread
                        ? "#f5f3ff"
                        : "#f9fafb",
                      borderRadius: 10,
                      padding: 10,
                      marginBottom: 8,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: hasUnread ? 700 : 600,
                          color: "#111827",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {title}
                      </div>
                      {price && (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#15803d",
                          }}
                        >
                          {price}
                        </span>
                      )}
                      {hasUnread && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            backgroundColor: "#4f46e5",
                            color: "#ffffff",
                            borderRadius: 999,
                            padding: "2px 8px",
                          }}
                        >
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        Com {otherName}
                      </span>
                      {c.lastMessage && (
                        <span
                          style={{
                            fontSize: 12,
                            color: "#9ca3af",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 180,
                          }}
                        >
                          {c.lastMessage}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* COLUNA DIREITA - CHAT */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {!selectedConversation ? (
            <div
              style={{
                fontSize: 14,
                color: "#6b7280",
              }}
            >
              Nenhuma conversa selecionada. Escolhe uma conversa na coluna da
              esquerda ou envia uma mensagem a partir de um anúncio.
            </div>
          ) : (
            <>
              {/* Header do chat */}
              <div
                style={{
                  marginBottom: 12,
                }}
              >
                {(() => {
                  const ad = ads[selectedConversation.adId];
                  const title =
                    ad?.titulo ?? `Anúncio #${selectedConversation.adId}`;
                  const price = formatPrice(ad?.preco);
                  const otherUser = users[selectedConversation.otherUserId];
                  const otherName = extractUserName(otherUser);

                  return (
                    <>
                      <h2
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          marginBottom: 2,
                        }}
                      >
                        {title}
                      </h2>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                        }}
                      >
                        {price && (
                          <span
                            style={{
                              fontWeight: 600,
                              color: "#111827",
                              marginRight: 6,
                            }}
                          >
                            {price}
                          </span>
                        )}
                        <span>Com {otherName}.</span>
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* Caixa de mensagens */}
              <div
                style={{
                  flex: 1,
                  borderRadius: 10,
                  backgroundColor: "#f9fafb",
                  padding: 12,
                  overflowY: "auto",
                  marginBottom: 12,
                  minHeight: 220,
                }}
              >
                {messages.length === 0 ? (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    Ainda não há mensagens nesta conversa. Escreve a primeira
                    mensagem abaixo.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {messages.map((m) => {
                      const isMine = m.sender_id === currentUserId;
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            justifyContent: isMine
                              ? "flex-end"
                              : "flex-start",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "70%",
                              borderRadius: 12,
                              padding: "6px 10px",
                              fontSize: 13,
                              lineHeight: 1.4,
                              backgroundColor: isMine
                                ? "#047857"
                                : "#e5e7eb",
                              color: isMine ? "#ffffff" : "#111827",
                            }}
                          >
                            {m.message}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Caixa de envio */}
              <form onSubmit={handleSendMessage}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Escrever mensagem…"
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 999,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessageText.trim()}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 999,
                      border: "none",
                      backgroundColor: sending
                        ? "#9ca3af"
                        : "#047857",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor:
                        sending || !newMessageText.trim()
                          ? "default"
                          : "pointer",
                    }}
                  >
                    {sending ? "A enviar…" : "Enviar"}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
