"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  // possíveis campos de nome
  full_name?: string | null;
  nome?: string | null;
  name?: string | null;
  username?: string | null;
  // possíveis campos de contacto (telefone)
  contacto?: string | null;
  contato?: string | null;
  telefone?: string | null;
  telemovel?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  contact_number?: string | null;
  // possíveis campos de departamento/curso
  departamento?: string | null;
  department?: string | null;
  curso?: string | null;
  course?: string | null;
  // outros campos que possam existir
  [key: string]: any;
};

const wrapperStyle: CSSProperties = {
  maxWidth: "700px",
  margin: "32px auto",
  padding: "16px",
};

const cardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 1px 4px rgba(15,23,42,0.08)",
};

const titleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 4,
};

const subtitleStyle: CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 16,
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "#374151",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
};

const inlineRow: CSSProperties = {
  display: "flex",
  gap: 12,
};

const inlineField: CSSProperties = {
  flex: 1,
};

const buttonRow: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 12,
  gap: 8,
};

const primaryButton: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "none",
  backgroundColor: "#111827",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButton: CSSProperties = {
  ...primaryButton,
  backgroundColor: "#e5e7eb",
  color: "#111827",
};

const helperText: CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
};

const errorText: CSSProperties = {
  fontSize: 13,
  color: "#dc2626",
  marginTop: 8,
};

const successText: CSSProperties = {
  fontSize: 13,
  color: "#16a34a",
  marginTop: 8,
};

function findField(
  profile: ProfileRow | null,
  candidates: (keyof ProfileRow)[]
): { key: keyof ProfileRow | null; value: string } {
  if (!profile) {
    return { key: null, value: "" };
  }

  // primeiro, algum desses campos com valor
  for (const k of candidates) {
    if (k in profile && profile[k] != null) {
      const v = profile[k];
      return { key: k, value: typeof v === "string" ? v : String(v ?? "") };
    }
  }

  // se não tiver valor, mas tiver a coluna, escolhe mesmo assim
  for (const k of candidates) {
    if (k in profile) {
      return { key: k, value: "" };
    }
  }

  return { key: null, value: "" };
}

export default function PerfilPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [nameFieldKey, setNameFieldKey] =
    useState<keyof ProfileRow | null>(null);

  const [contactValue, setContactValue] = useState("");
  const [initialContactValue, setInitialContactValue] = useState("");
  const [contactFieldKey, setContactFieldKey] =
    useState<keyof ProfileRow | null>(null);

  const [depValue, setDepValue] = useState("");
  const [initialDepValue, setInitialDepValue] = useState("");
  const [depFieldKey, setDepFieldKey] =
    useState<keyof ProfileRow | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1) obter utilizador atual
  useEffect(() => {
    (async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error(error);
      }

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? null);
    })();
  }, [router]);

  // 2) carregar dados do perfil (select * para não dar erro de coluna)
  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single<ProfileRow>();

      if (error) {
        console.error(error);
        setError("Não foi possível carregar o teu perfil.");
        setLoading(false);
        return;
      }

      const profile = data ?? null;

      // nome
      const { key: nameKey, value: nameVal } = findField(profile, [
        "full_name",
        "nome",
        "name",
        "username",
      ]);
      setName(nameVal);
      setInitialName(nameVal);
      setNameFieldKey(nameKey);

      // contacto (telefone)
      const { key: contactKey, value: contactVal } = findField(profile, [
        "contacto",
        "contato",
        "telefone",
        "telemovel",
        "phone",
        "phone_number",
        "contact_number",
      ]);
      setContactValue(contactVal);
      setInitialContactValue(contactVal);
      setContactFieldKey(contactKey);

      // departamento / curso
      const { key: depKey, value: depVal } = findField(profile, [
        "departamento",
        "department",
        "curso",
        "course",
      ]);
      setDepValue(depVal);
      setInitialDepValue(depVal);
      setDepFieldKey(depKey);

      setLoading(false);
    })();
  }, [userId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;

    if (!name.trim()) {
      setError("O nome não pode estar vazio.");
      setSuccess(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: Partial<ProfileRow> = {};

    if (nameFieldKey) {
      payload[nameFieldKey] = name.trim();
    }

    if (contactFieldKey) {
      payload[contactFieldKey] = contactValue.trim();
    }

    if (depFieldKey) {
      payload[depFieldKey] = depValue.trim();
    }

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId);

    setSaving(false);

    if (error) {
      console.error(error);
      setError("Não foi possível guardar as alterações.");
      return;
    }

    setInitialName(name.trim());
    setInitialContactValue(contactValue.trim());
    setInitialDepValue(depValue.trim());
    setSuccess("Perfil atualizado com sucesso!");
  }

  function handleReset() {
    setName(initialName);
    setContactValue(initialContactValue);
    setDepValue(initialDepValue);
    setError(null);
    setSuccess(null);
  }

  return (
    <main style={wrapperStyle}>
      <section style={cardStyle}>
        <h1 style={titleStyle}>Perfil</h1>
        <p style={subtitleStyle}>
          Atualiza os teus dados. O nome é usado no topo da aplicação e nas
          conversas de mensagens.
        </p>

        {loading ? (
          <p style={{ fontSize: 14 }}>A carregar perfil…</p>
        ) : (
          <form onSubmit={handleSubmit} style={formStyle}>
            {/* Email */}
            <div>
              <label style={labelStyle}>Email institucional</label>
              <input
                type="email"
                value={email ?? ""}
                disabled
                style={{
                  ...inputStyle,
                  backgroundColor: "#f9fafb",
                  color: "#6b7280",
                  cursor: "not-allowed",
                }}
              />
              <p style={helperText}>
                O email é gerido pela tua organização. Se precisares de
                alterar, fala com o administrador.
              </p>
            </div>

            {/* Nome */}
            <div>
              <label htmlFor="full_name" style={labelStyle}>
                Nome completo
              </label>
              <input
                id="full_name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Ana Júlia Santos"
                style={inputStyle}
              />
              <p style={helperText}>
                Este nome aparece nas mensagens e no canto superior da
                plataforma.
              </p>
            </div>

            {/* Contacto + Departamento */}
            <div style={inlineRow}>
              <div style={inlineField}>
                <label htmlFor="contact" style={labelStyle}>
                  Contacto
                </label>
                <input
                  id="contact"
                  type="text"
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder="Ex.: +351 912 345 678"
                  style={inputStyle}
                />
                <p style={helperText}>
                  Número de telefone/telemóvel para contacto nas negociações.
                </p>
              </div>

              <div style={inlineField}>
                <label htmlFor="departamento" style={labelStyle}>
                  Departamento / Curso
                </label>
                <input
                  id="departamento"
                  type="text"
                  value={depValue}
                  onChange={(e) => setDepValue(e.target.value)}
                  placeholder="Ex.: GSI, Enfermagem…"
                  style={inputStyle}
                />
                <p style={helperText}>
                  Departamento, curso ou unidade a que pertences.
                </p>
              </div>
            </div>

            <div style={buttonRow}>
              <button
                type="button"
                onClick={handleReset}
                style={secondaryButton}
                disabled={saving}
              >
                Repor
              </button>
              <button
                type="submit"
                style={primaryButton}
                disabled={saving || !name.trim()}
              >
                {saving ? "A guardar…" : "Guardar alterações"}
              </button>
            </div>

            {error && <p style={errorText}>{error}</p>}
            {success && <p style={successText}>{success}</p>}
          </form>
        )}
      </section>
    </main>
  );
}
