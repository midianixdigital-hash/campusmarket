"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ChatMessageRow = {
  id: number;
  ad_id: number;
  sender_id: string;
  receiver_id: string;
  created_at: string;
};

type UserProfile = {
  id: string;
  full_name?: string | null;
  nome?: string | null;
  name?: string | null;
  username?: string | null;
};

const headerStyle: CSSProperties = {
  width: "100%",
  padding: "10px 24px",
  backgroundColor: "#020617",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box",
};

const leftGroup: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 24,
};

const logoStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
};

const navLinksStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const navLink: CSSProperties = {
  fontSize: 14,
  color: "#e5e7eb",
  textDecoration: "none",
};

const navLinkActive: CSSProperties = {
  ...navLink,
  color: "#ffffff",
  fontWeight: 600,
};

const rightGroup: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const iconButton: CSSProperties = {
  position: "relative",
  width: 36,
  height: 36,
  borderRadius: 999,
  border: "1px solid #1f2937",
  backgroundColor: "#020617",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#e5e7eb",
};

const iconButtonActive: CSSProperties = {
  ...iconButton,
  backgroundColor: "#111827",
  borderColor: "#111827",
  color: "#ffffff",
};

const iconStyle: CSSProperties = {
  width: 18,
  height: 18,
};

const badgeDot: CSSProperties = {
  position: "absolute",
  top: 5,
  right: 5,
  width: 8,
  height: 8,
  borderRadius: "999px",
  backgroundColor: "#ef4444",
};

const newAdButton: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "none",
  backgroundColor: "#f9fafb",
  color: "#020617",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const entrarButton: CSSProperties = {
  ...newAdButton,
  backgroundColor: "#111827",
  color: "#f9fafb",
};

const userNameStyle: CSSProperties = {
  fontSize: 13,
  color: "#e5e7eb",
};

function extractName(profile: UserProfile | null): string | null {
  if (!profile) return null;
  return (
    profile.full_name ??
    profile.nome ??
    profile.name ??
    profile.username ??
    null
  );
}

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // pega sessão atual (sem estourar erro se não tiver)
  useEffect(() => {
    (async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        setCurrentUserId(null);
        setCurrentUserName(null);
        return;
      }

      const user = session?.user ?? null;
      setCurrentUserId(user?.id ?? null);

      if (user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single<UserProfile>();

        if (!profileError && profile) {
          setCurrentUserName(extractName(profile));
        }
      } else {
        setCurrentUserName(null);
      }
    })();
  }, []);

  // verifica conversas com última msg do outro
  useEffect(() => {
    if (!currentUserId) {
      setHasNewMessages(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, ad_id, sender_id, receiver_id, created_at")
        .or(
          `sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (error || !data) return;

      const map = new Map<string, { lastSenderIsOther: boolean }>();

      for (const row of data as ChatMessageRow[]) {
        const otherId =
          row.sender_id === currentUserId
            ? row.receiver_id
            : row.sender_id;
        const key = `${row.ad_id}-${otherId}`;

        if (!map.has(key)) {
          map.set(key, {
            lastSenderIsOther: row.sender_id !== currentUserId,
          });
        }
      }

      const anyNew = Array.from(map.values()).some(
        (c) => c.lastSenderIsOther
      );
      setHasNewMessages(anyNew);
    })();
  }, [currentUserId]);

  // ao entrar em /mensagens limpa badge
  useEffect(() => {
    if (pathname.startsWith("/mensagens")) {
      setHasNewMessages(false);
    }
  }, [pathname]);

  // realtime: ao receber mensagem nova para mim -> bolinha true
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("chat-messages-top-bar")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        () => setHasNewMessages(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setCurrentUserId(null);
    setCurrentUserName(null);
    setHasNewMessages(false);
    router.replace("/login"); // leva direto pro login
  }

  const isHome = pathname === "/" || pathname.startsWith("/anuncio");
  const isMeus = pathname.startsWith("/meus-anuncios");
  const isPendentes = pathname.startsWith("/pendentes");
  const isMensagens = pathname.startsWith("/mensagens");
  const isPerfil = pathname.startsWith("/perfil");

  const isLoggedIn = !!currentUserId;

  return (
    <header style={headerStyle}>
      <div style={leftGroup}>
        <Link href="/" style={logoStyle}>
          CampusMarket
        </Link>

        <nav style={navLinksStyle}>
          <Link
            href="/"
            style={isHome ? navLinkActive : navLink}
          >
            Anúncios
          </Link>
          {isLoggedIn && (
            <>
              <Link
                href="/meus-anuncios"
                style={isMeus ? navLinkActive : navLink}
              >
                Meus anúncios
              </Link>
              <Link
                href="/pendentes"
                style={isPendentes ? navLinkActive : navLink}
              >
                Pendentes
              </Link>
            </>
          )}
        </nav>
      </div>

      <div style={rightGroup}>
        {!isLoggedIn && (
          <button
            type="button"
            style={entrarButton}
            onClick={() => router.push("/login")}
          >
            Entrar
          </button>
        )}

        {isLoggedIn && (
          <>
            {/* Mensagens */}
            <Link href="/mensagens">
              <div
                style={isMensagens ? iconButtonActive : iconButton}
                title="Mensagens"
              >
                <svg viewBox="0 0 24 24" style={iconStyle}>
                  <path
                    d="M5 5h14a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-5.586l-3.707 3.707A1 1 0 0 1 8 19.5V16H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                    fill="currentColor"
                  />
                </svg>
                {hasNewMessages && <span style={badgeDot} />}
              </div>
            </Link>

            {/* Nome do utilizador + ícone */}
            {currentUserName && (
              <span style={userNameStyle}>{currentUserName}</span>
            )}

            <Link href="/perfil">
              <div
                style={isPerfil ? iconButtonActive : iconButton}
                title="Perfil"
              >
                <svg viewBox="0 0 24 24" style={iconStyle}>
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.418 0-8 1.79-8 4v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.21-3.582-4-8-4Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </Link>

            {/* Logout (porta) */}
            <button
              type="button"
              onClick={handleLogout}
              style={iconButton}
              title="Terminar sessão"
            >
              <svg viewBox="0 0 24 24" style={iconStyle}>
                <path
                  d="M10 4a1 1 0 0 1 1-1h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a1 1 0 0 1-1-1v-2h2v1h6V6h-6v1h-2Zm-1.293 5.293 1.414 1.414L8.828 12H16v2H8.828l1.293 1.293-1.414 1.414L5 12Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            {/* Novo anúncio */}
            <button
              type="button"
              onClick={() => router.push("/novo-anuncio")}
              style={newAdButton}
            >
              + Novo anúncio
            </button>
          </>
        )}
      </div>
    </header>
  );
}
