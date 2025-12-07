"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Message = {
  id: number;
  sender_id: string;
  content: string;
  created_at: string;
};

const wrapperStyle: React.CSSProperties = {
  maxWidth: "720px",
  margin: "24px auto",
  padding: "16px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  backgroundColor: "#ffffff",
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 96px)",
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 8,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 12,
};

const messagesBoxStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "8px 0",
  borderTop: "1px solid #e5e7eb",
  borderBottom: "1px solid #e5e7eb",
};

const msgRowStyleBase: React.CSSProperties = {
  display: "flex",
  marginBottom: 6,
};

const msgBubbleBase: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 12,
  maxWidth: "70%",
  fontSize: 14,
};

const mineBubble: React.CSSProperties = {
  ...msgBubbleBase,
  backgroundColor: "#111827",
  color: "#ffffff",
  marginLeft: "auto",
};

const otherBubble: React.CSSProperties = {
  ...msgBubbleBase,
  backgroundColor: "#f3f4f6",
  color: "#111827",
};

const inputRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 12,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  borderRadius: 999,
  border: "1px solid #d1d5db",
  padding: "8px 12px",
  fontSize: 14,
};

const sendButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "none",
  backgroundColor: "#111827",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
};

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const interestId = params?.id;

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Carrega user + mensagens iniciais
  useEffect(() => {
    async function init() {
      if (!interestId) return;

      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Precisa estar autenticado para ver esta conversa.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // ⚠️ Ajuste os nomes de colunas se necessário:
      // chat_messages(interest_id, sender_id, content, created_at)
      const { data, error: msgError } = await supabase
        .from("chat_messages")
        .select("id, sender_id, content, created_at")
        .eq("interest_id", interestId)
        .order("created_at", { ascending: true });

      if (msgError) {
        console.error(msgError);
        setError("Erro ao carregar as mensagens.");
      } else {
        setMessages(data || []);
      }

      setLoading(false);

      // subscrição realtime (opcional mas legal)
      const channel = supabase
        .channel(`chat-${interestId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `interest_id=eq.${interestId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => [...prev, newMsg]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    init();
  }, [interestId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !userId || !interestId) return;

    setSending(true);
    setError(null);

    const { error: sendError } = await supabase.from("chat_messages").insert([
      {
        interest_id: interestId,
        sender_id: userId,
        content: text.trim(),
      },
    ]);

    if (sendError) {
      console.error(sendError);
      setError("Erro ao enviar mensagem.");
    } else {
      setText("");
      // o realtime já adiciona a mensagem nova à lista
    }

    setSending(false);
  }

  if (!interestId) {
    return (
      <div style={wrapperStyle}>
        <p>ID da conversa não informado.</p>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <div>
        <h1 style={titleStyle}>Conversa sobre o anúncio</h1>
        <p style={subtitleStyle}>
          Combine detalhes, preço e forma de entrega diretamente com o
          anunciante.
        </p>
      </div>

      <div style={messagesBoxStyle}>
        {loading ? (
          <p style={subtitleStyle}>A carregar mensagens…</p>
        ) : messages.length === 0 ? (
          <p style={subtitleStyle}>
            Nenhuma mensagem ainda. Comece a conversa! 🙂
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === userId;
            return (
              <div
                key={m.id}
                style={{
                  ...msgRowStyleBase,
                  justifyContent: isMine ? "flex-end" : "flex-start",
                }}
              >
                <div style={isMine ? mineBubble : otherBubble}>
                  <div>{m.content}</div>
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.7,
                      marginTop: 2,
                      textAlign: isMine ? "right" : "left",
                    }}
                  >
                    {new Date(m.created_at).toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <p style={{ ...subtitleStyle, color: "#dc2626", marginTop: 8 }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSend} style={inputRowStyle}>
        <input
          style={inputStyle}
          placeholder="Escreva uma mensagem…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          style={sendButtonStyle}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
