"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const linkStyle = {
  color: "#e5e7eb",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 500,
} as const;

const buttonStyle = {
  ...linkStyle,
  border: "none",
  background: "none",
  cursor: "pointer",
} as const;

type User = {
  id: string;
  email?: string;
};

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser((data.user as any) ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser((session?.user as any) ?? null);
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    // não precisa redirecionar, mas se quiser:
    // location.href = "/";
  }

  if (loading) return null;

  if (!user) {
    return (
      <Link href="/login" style={linkStyle}>
        Entrar
      </Link>
    );
  }

  return (
    <button type="button" style={buttonStyle} onClick={handleLogout}>
      Sair
    </button>
  );
}
