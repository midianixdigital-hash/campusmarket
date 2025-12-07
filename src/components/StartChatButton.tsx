"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type StartChatButtonProps = {
  adId: number;
  ownerId: string;
};

export function StartChatButton({ adId, ownerId }: StartChatButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    if (loading) return;

    setLoading(true);
    try {
      // Garante que o utilizador está autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Precisas de iniciar sessão para enviar mensagens.");
        router.push("/login");
        return;
      }

      // Não deixa a pessoa enviar mensagem para o próprio anúncio
      if (user.id === ownerId) {
        alert("Este é o teu próprio anúncio, não precisas de enviar mensagem. 🙂");
        return;
      }

      const params = new URLSearchParams({
        adId: String(adId),
        with: ownerId,
      });

      // Aqui NÃO criamos mensagem nenhuma.
      // Só abrimos a página de mensagens com o anúncio certo.
      router.push(`/mensagens?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        marginTop: 12,
        width: "100%",
        borderRadius: 999,
        border: "none",
        padding: "10px 16px",
        backgroundColor: "#047857",
        color: "#ffffff",
        fontSize: 14,
        fontWeight: 600,
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "A abrir conversa..." : "Enviar mensagem ao anunciante"}
    </button>
  );
}
