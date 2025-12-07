"use client";

import { useEffect, useState, type ReactNode, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AppShellProps = {
  children: ReactNode;
};

type ProfileRow = {
  id: string;
  nome: string | null;
  email?: string | null;
};

const BRAND = "#1bb5b8";
const BRAND_DARK = "#0f7f81";

/* ----------------- STYLES ----------------- */

const shellBackground: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, #e2fbfa 0%, #f9fffe 40%, #f7fbfc 70%, #f0f7f7 100%)",
};

const headerShadow =
  "0 20px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 148, 136, 0.05)";

const headerContainer: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 30,
  padding: "16px 32px 0 32px",
};

const headerInner: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 20px",
  borderRadius: 999,
  background: "#ffffff",
  boxShadow: headerShadow,
  gap: 24,
};

const brandBlock: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const brandCircle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "999px",
  backgroundColor: BRAND,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 0 0 4px rgba(27, 181, 184, 0.18)",
};

const brandLetter: CSSProperties = {
  fontWeight: 800,
  fontSize: 22,
  color: "#ffffff",
};

const brandTextBlock: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  lineHeight: 1.1,
};

const brandTitle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: 0.2,
  color: "#022c22",
};

const brandSubtitle: CSSProperties = {
  fontSize: 11,
  color: "#4b5563",
};

const navLinksWrapper: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 20,
  marginLeft: 32,
};

const navLinkBase: CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  paddingBottom: 4,
  borderBottom: "2px solid transparent",
  color: "#4b5563",
  textDecoration: "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const userSection: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  marginLeft: "auto",
};

const userNameStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#022c22",
  maxWidth: 180,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  overflow: "hidden",
};

const iconCircleBase: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(148, 163, 184, 0.4)",
  background: "#f9fafb",
  cursor: "pointer",
  position: "relative",
  transition: "all 0.15s ease",
};

const newAdButton: CSSProperties = {
  borderRadius: 999,
  padding: "10px 22px",
  border: "none",
  outline: "none",
  background:
    "linear-gradient(135deg, " + BRAND + " 0%, " + BRAND_DARK + " 100%)",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 16px 30px rgba(15, 127, 129, 0.35)",
  whiteSpace: "nowrap",
};

const mainWrapper: CSSProperties = {
  padding: "18px 32px 32px 32px",
};

/* ----------------- COMPONENT ----------------- */

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  // esconder o header apenas em landing e login
  const hideHeader = pathname === "/landing" || pathname === "/login";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) {
        if (!cancelled) {
          setProfile(null);
          setUnreadCount(0);
          setIsGlobalAdmin(false);
        }
        return;
      }

      const userId = user.id;

      const [{ data: profileData }, { data: adminRows }, unreadResult] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, nome")
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("global_admins")
            .select("user_id")
            .eq("user_id", userId),
          supabase
            .from("chat_messages")
            .select("id", { head: true, count: "exact" })
            .eq("receiver_id", userId)
            .eq("is_read", false),
        ]);

      if (cancelled) return;

      const nome =
        profileData?.nome ||
        user.user_metadata?.nome ||
        user.user_metadata?.full_name ||
        user.email ||
        "Utilizador";

      setProfile({
        id: userId,
        nome,
        email: user.email ?? undefined,
      });

      setIsGlobalAdmin((adminRows ?? []).length > 0);

      const unread = typeof unreadResult.count === "number" ? unreadResult.count : 0;
      setUnreadCount(unread);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUnreadCount(0);
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const renderNavLink = (href: string, label: string) => {
    const active = isActive(href);
    const style: CSSProperties = {
      ...navLinkBase,
      color: active ? BRAND_DARK : "#4b5563",
      borderBottomColor: active ? BRAND : "transparent",
    };
    return (
      <Link key={href} href={href} style={style}>
        {label}
      </Link>
    );
  };

  // se for landing ou login, NÃO mostra o menu – só o conteúdo
  if (hideHeader) {
    return <>{children}</>;
  }

  const displayName = profile?.nome || "Utilizador";

  return (
    <div style={shellBackground}>
      {/* HEADER */}
      <div style={headerContainer}>
        <div style={headerInner}>
          <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
            <Link href="/" style={brandBlock}>
              <div style={brandCircle}>
                <span style={brandLetter}>C</span>
              </div>
              <div style={brandTextBlock}>
                <span style={brandTitle}>CampusMarket</span>
                <span style={brandSubtitle}>
                  Marketplace interno para universidades
                </span>
              </div>
            </Link>

            <nav style={navLinksWrapper}>
              {renderNavLink("/", "Anúncios")}
              {renderNavLink("/meus-anuncios", "Meus anúncios")}
              {renderNavLink("/pendentes", "Pendentes")}
              {renderNavLink("/avaliacoes", "Avaliações")}
              {renderNavLink("/relatorios", "Relatórios")}
            </nav>
          </div>

          <div style={userSection}>
            <span style={userNameStyle} title={displayName}>
              {displayName}
            </span>

            {/* mensagens */}
            <Link href="/mensagens" style={iconCircleBase}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ transform: "translateY(0.5px)" }}
              >
                <path
                  d="M5 5h14a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H8.4L5.2 19.8A1 1 0 0 1 4 18.9V7a2 2 0 0 1 2-2Z"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 9,
                    height: 9,
                    borderRadius: "999px",
                    backgroundColor: "#ef4444",
                    boxShadow: "0 0 0 2px #ffffff",
                  }}
                />
              )}
            </Link>

            {/* admin / painel (se for global admin) */}
            {isGlobalAdmin && (
              <Link
                href="/super-admin"
                style={iconCircleBase}
                title="Painel administrativo"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3 4 7v5c0 4 2.7 7.4 8 9 5.3-1.6 8-5 8-9V7l-8-4Z"
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            )}

            {/* perfil – só ícone, por enquanto */}
            <div style={iconCircleBase} aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 1.5c-4 0-7 2-7 4.5a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5c0-2.5-3-4.5-7-4.5Z"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* terminar sessão */}
            <button
              type="button"
              onClick={handleLogout}
              style={{ ...iconCircleBase, borderColor: "rgba(248, 113, 113, 0.5)" }}
              title="Terminar sessão"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M9 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2M16 12H9m7 0-2.5-2.5M16 12l-2.5 2.5"
                  fill="none"
                  stroke="#b91c1c"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* botão novo anúncio */}
            <Link href="/novo-anuncio" style={newAdButton}>
              + Novo anúncio
            </Link>
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <main style={mainWrapper}>{children}</main>
    </div>
  );
}
