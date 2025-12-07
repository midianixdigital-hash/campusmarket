"use client";

import type { CSSProperties, FormEvent, ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/** TYPES **/

type OrganizationRow = {
  id: number;
  name?: string | null;
  tipo?: string | null;
  slug?: string | null;
  created_at?: string | null;

  is_active?: boolean | null;

  // MÓDULOS
  module_esg_premium?: boolean | null;

  contract_type?: string | null;
  contract_start?: string | null;
  contract_end?: string | null;
  contract_value?: number | null;
  contract_currency?: string | null;
  contract_seats?: number | null; // utilizadores contratados
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contract_notes?: string | null;

  [key: string]: any;
};

type OrganizationStatsRow = {
  org_id: number;
  name: string | null;
  tipo: string | null;
  slug: string | null;
  is_active: boolean | null;
  contract_seats: number | null;

  total_users: number;
  total_ads: number;
  ads_vendidos: number;
};

type MemberProfile = {
  id: string;
  nome?: string | null;
  contacto?: string | null;
  email?: string | null;
};

type OrgMemberRow = {
  user_id: string;
  organization_id: number;
  role?: string | null;
  is_blocked?: boolean | null;
  profile?: MemberProfile | null;
};

/** STYLES **/

const wrapperStyle: CSSProperties = {
  maxWidth: 1180,
  margin: "24px auto",
  padding: "16px",
};

const titleStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 4,
};

const subtitleStyle: CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 16,
};

const cardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 1px 6px rgba(15,23,42,0.08)",
};

const cardTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 8,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 12,
  boxSizing: "border-box" as const,
};

const selectStyle: CSSProperties = {
  ...inputStyle,
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 60,
  resize: "vertical" as const,
};

const smallText: CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
};

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginBottom: 10,
};

const buttonRow: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 8,
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

const primaryButtonDisabled: CSSProperties = {
  ...primaryButton,
  opacity: 0.6,
  cursor: "default",
};

const secondaryButton: CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  backgroundColor: "#f9fafb",
  color: "#111827",
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
};

const subtleButton: CSSProperties = {
  padding: "4px 8px",
  borderRadius: 999,
  border: "none",
  backgroundColor: "transparent",
  color: "#4b5563",
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
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

const tableWrapper: CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "8px 6px",
  borderBottom: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "6px 6px",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
};

const miniTableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
};

const miniThStyle: CSSProperties = {
  textAlign: "left",
  padding: "6px 4px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
};

const miniTdStyle: CSSProperties = {
  padding: "4px 4px",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
};

const statusBadgeActive: CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  backgroundColor: "#dcfce7",
  color: "#166534",
};

const statusBadgeInactive: CSSProperties = {
  ...statusBadgeActive,
  backgroundColor: "#fee2e2",
  color: "#b91c1c",
};

const chip: CSSProperties = {
  display: "inline-block",
  padding: "2px 6px",
  borderRadius: 999,
  backgroundColor: "#f3f4f6",
  fontSize: 11,
  color: "#4b5563",
  marginRight: 4,
  marginBottom: 2,
};

const chipStrong: CSSProperties = {
  ...chip,
  fontWeight: 600,
};

const chipsRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
};

// NOVOS STYLES PARA MÓDULOS
const modulesRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 6,
};

const modulePillBase: CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  fontSize: 11,
  cursor: "pointer",
  backgroundColor: "#f9fafb",
  color: "#6b7280",
};

const modulePillActive: CSSProperties = {
  ...modulePillBase,
  borderColor: "#047857",
  backgroundColor: "#ecfdf5",
  color: "#047857",
  fontWeight: 600,
};

/** COMPONENTE **/

export default function SuperAdminPage() {
  const router = useRouter();

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [orgStats, setOrgStats] = useState<OrganizationStatsRow[]>([]);

  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  const [orgMembers, setOrgMembers] = useState<OrgMemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const [orgNome, setOrgNome] = useState("");
  const [orgTipo, setOrgTipo] = useState<"universidade" | "empresa">(
    "universidade"
  );
  const [orgSlug, setOrgSlug] = useState("");

  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [savingOrgId, setSavingOrgId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /** AUTH + GLOBAL ADMIN **/

  useEffect(() => {
    (async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) console.error(error);

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserEmail(user.email ?? null);

      const { data: adminRow, error: adminError } = await supabase
        .from("global_admins")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) console.error(adminError);

      setIsGlobalAdmin(!!adminRow);
      setAuthChecked(true);
    })();
  }, [router]);

  /** CARREGAR ORGANIZAÇÕES / STATS **/

  useEffect(() => {
    if (!authChecked || !isGlobalAdmin) return;

    async function loadData() {
      setLoadingOrgs(true);
      setError(null);
      setSuccess(null);

      const { data: orgs, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (orgError) {
        console.error(orgError);
        setError("Não foi possível carregar as organizações.");
      } else {
        setOrganizations((orgs ?? []) as OrganizationRow[]);
      }

      const { data: stats, error: statsError } = await supabase
        .from("organization_stats")
        .select("*");

      if (statsError) {
        console.error(statsError);
      } else {
        setOrgStats((stats ?? []) as OrganizationStatsRow[]);
      }

      setLoadingOrgs(false);
    }

    loadData();
  }, [authChecked, isGlobalAdmin]);

  /** CARREGAR UTILIZADORES DA ORG (user_organizations + profiles) **/

  useEffect(() => {
    if (!selectedOrgId) {
      setOrgMembers([]);
      return;
    }

    async function loadMembers() {
      setMembersLoading(true);
      setError(null);

      const { data: members, error } = await supabase
        .from("user_organizations")
        .select("user_id, organization_id, role, is_blocked")
        .eq("organization_id", selectedOrgId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        setError("Não foi possível carregar os utilizadores da organização.");
        setMembersLoading(false);
        return;
      }

      if (!members || members.length === 0) {
        setOrgMembers([]);
        setMembersLoading(false);
        return;
      }

      const typedMembers = members as OrgMemberRow[];
      const userIds = typedMembers.map((m) => m.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, contacto, email")
        .in("id", userIds);

      if (profilesError) console.error(profilesError);

      const profileMap = new Map<string, MemberProfile>();
      (profiles ?? []).forEach((p: any) => {
        profileMap.set(p.id, {
          id: p.id,
          nome: p.nome,
          contacto: p.contacto,
          email: p.email,
        });
      });

      const withProfiles: OrgMemberRow[] = typedMembers.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) ?? null,
      }));

      setOrgMembers(withProfiles);
      setMembersLoading(false);
    }

    loadMembers();
  }, [selectedOrgId]);

  /** HELPERS **/

  function gerarSlugBase(nome: string) {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleCreateOrg(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!orgNome.trim() || !orgSlug.trim()) {
      setError("Nome e slug são obrigatórios.");
      return;
    }

    setCreatingOrg(true);

    try {
      const slugLimpo = orgSlug.trim().toLowerCase();

      const { error: insertError } = await supabase
        .from("organizations")
        .insert([
          {
            name: orgNome.trim(),
            tipo: orgTipo,
            slug: slugLimpo,
            is_active: true,
          },
        ]);

      if (insertError) {
        console.error(insertError);
        setError("Não foi possível criar a organização.");
        setCreatingOrg(false);
        return;
      }

      setSuccess("Organização criada com sucesso.");
      setOrgNome("");
      setOrgSlug("");

      const { data: orgsReload } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (orgsReload) {
        setOrganizations(orgsReload as OrganizationRow[]);
      }

      const { data: statsReload } = await supabase
        .from("organization_stats")
        .select("*");
      if (statsReload) {
        setOrgStats(statsReload as OrganizationStatsRow[]);
      }
    } finally {
      setCreatingOrg(false);
    }
  }

  function handleOrgFieldChange(
    orgId: number,
    field: keyof OrganizationRow,
    value: string
  ) {
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === orgId
          ? {
              ...o,
              [field]:
                field === "contract_value"
                  ? value === ""
                    ? null
                    : Number(value.replace(",", "."))
                  : field === "contract_seats"
                  ? value === ""
                    ? null
                    : Number(value)
                  : value,
            }
          : o
      )
    );
  }

  // NOVO: toggle de módulos no estado
  function toggleOrgModule(orgId: number, field: keyof OrganizationRow) {
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === orgId
          ? {
              ...o,
              [field]: !(o as any)[field],
            }
          : o
      )
    );
  }

  async function handleSaveOrg(org: OrganizationRow) {
    setError(null);
    setSuccess(null);
    setSavingOrgId(org.id);

    try {
      const payload = {
        tipo: org.tipo ?? null,
        is_active: org.is_active ?? true,

        // MÓDULOS
        module_esg_premium: org.module_esg_premium ?? false,

        contract_type: org.contract_type ?? null,
        contract_start: org.contract_start ?? null,
        contract_end: org.contract_end ?? null,
        contract_value: org.contract_value ?? null,
        contract_currency: org.contract_currency ?? null,
        contract_seats: org.contract_seats ?? null,
        contact_name: org.contact_name ?? null,
        contact_email: org.contact_email ?? null,
        contact_phone: org.contact_phone ?? null,
        contract_notes: org.contract_notes ?? null,
      };

      const { error } = await supabase
        .from("organizations")
        .update(payload)
        .eq("id", org.id);

      if (error) {
        console.error(error);
        setError("Não foi possível guardar as alterações.");
        return;
      }

      setSuccess("Alterações guardadas.");
      const { data: statsReload } = await supabase
        .from("organization_stats")
        .select("*");
      if (statsReload) {
        setOrgStats(statsReload as OrganizationStatsRow[]);
      }
    } finally {
      setSavingOrgId(null);
    }
  }

  async function toggleOrgActive(org: OrganizationRow) {
    const newValue = !org.is_active;
    const { error } = await supabase
      .from("organizations")
      .update({ is_active: newValue })
      .eq("id", org.id);

    if (error) {
      console.error(error);
      setError("Não foi possível atualizar o estado da organização.");
      return;
    }

    setOrganizations((prev) =>
      prev.map((o) => (o.id === org.id ? { ...o, is_active: newValue } : o))
    );
  }

  async function handleMemberRoleChange(member: OrgMemberRow, role: string) {
    setError(null);
    setUpdatingMemberId(member.user_id);

    try {
      const { error } = await supabase
        .from("user_organizations")
        .update({ role })
        .eq("user_id", member.user_id)
        .eq("organization_id", selectedOrgId);

      if (error) {
        console.error(error);
        setError("Não foi possível atualizar o perfil do utilizador.");
        return;
      }

      setOrgMembers((prev) =>
        prev.map((m) =>
          m.user_id === member.user_id ? { ...m, role } : m
        )
      );
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function toggleMemberBlocked(member: OrgMemberRow) {
    setError(null);
    const newValue = !member.is_blocked;
    setUpdatingMemberId(member.user_id);

    try {
      const { error } = await supabase
        .from("user_organizations")
        .update({ is_blocked: newValue })
        .eq("user_id", member.user_id)
        .eq("organization_id", selectedOrgId);

      if (error) {
        console.error(error);
        setError("Não foi possível atualizar o estado do utilizador.");
        return;
      }

      setOrgMembers((prev) =>
        prev.map((m) =>
          m.user_id === member.user_id ? { ...m, is_blocked: newValue } : m
        )
      );
    } finally {
      setUpdatingMemberId(null);
    }
  }

  /** DERIVADOS **/

  const selectedOrg =
    selectedOrgId !== null
      ? organizations.find((o) => o.id === selectedOrgId) ?? null
      : null;

  const selectedStats =
    selectedOrgId !== null
      ? orgStats.find((s) => s.org_id === selectedOrgId) ?? null
      : null;

  const filteredMembers =
    memberSearch.trim().length === 0
      ? orgMembers
      : orgMembers.filter((m) => {
          const name = m.profile?.nome ?? "";
          const contacto = m.profile?.contacto ?? "";
          const email = m.profile?.email ?? "";
          const q = memberSearch.toLowerCase();
          return (
            name.toLowerCase().includes(q) ||
            contacto.toLowerCase().includes(q) ||
            email.toLowerCase().includes(q)
          );
        });

  const totalAdmins = orgMembers.filter((m) => m.role === "admin").length;
  const totalBlocked = orgMembers.filter((m) => m.is_blocked).length;

  // para a tabela de cima ainda uso organization_stats
  const selectedStatsUsers = selectedStats?.total_users ?? 0;

  const contractedUsers =
    selectedOrg?.contract_seats ?? selectedStats?.contract_seats ?? null;

  // para a barra uso a lista real de membros carregados
  const currentUsersForBar = orgMembers.length;
  const progress =
    contractedUsers && contractedUsers > 0
      ? Math.min(100, (currentUsersForBar / contractedUsers) * 100)
      : 0;

  /** RENDER **/

  if (!authChecked) {
    return (
      <main style={wrapperStyle}>
        <p style={{ fontSize: 14 }}>A verificar permissões…</p>
      </main>
    );
  }

  if (authChecked && !isGlobalAdmin) {
    return (
      <main style={wrapperStyle}>
        <h1 style={titleStyle}>Super painel</h1>
        <p style={subtitleStyle}>
          O teu utilizador (<strong>{currentUserEmail ?? "sem email"}</strong>)
          não está autorizado a aceder ao painel de super administração.
        </p>
      </main>
    );
  }

  return (
    <main style={wrapperStyle}>
      <h1 style={titleStyle}>Super painel</h1>
      <p style={subtitleStyle}>
        Gestão de organizações, contratos, utilizadores e estatísticas do
        CampusMarket.
      </p>

      {/* LINHA 1: TABELA + CRIAR ORG */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 1.2fr)",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        {/* TABELA ORGANIZAÇÕES */}
        <section style={cardStyle}>
          <h2 style={cardTitleStyle}>Organizações</h2>

          {loadingOrgs ? (
            <p style={{ fontSize: 14 }}>A carregar organizações…</p>
          ) : organizations.length === 0 ? (
            <p style={{ fontSize: 14, color: "#6b7280" }}>
              Ainda não existem organizações. Cria a primeira ao lado.
            </p>
          ) : (
            <div style={tableWrapper}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Organização</th>
                    <th style={thStyle}>Tipo</th>
                    <th style={thStyle}>Utilizadores</th>
                    <th style={thStyle}>Anúncios</th>
                    <th style={thStyle}>Estado</th>
                    <th style={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => {
                    const created = org.created_at
                      ? new Date(org.created_at).toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : null;

                    const stats = orgStats.find((s) => s.org_id === org.id);
                    const totalUsers = stats?.total_users ?? 0;
                    const totalAds = stats?.total_ads ?? 0;
                    const contracted =
                      org.contract_seats ?? stats?.contract_seats ?? null;

                    const isSelected = selectedOrgId === org.id;

                    return (
                      <tr key={org.id}>
                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrgId(org.id)}
                            style={{
                              all: "unset",
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            {org.name ?? "(sem nome)"}
                          </button>
                          <div style={{ ...chipsRow }}>
                            {org.slug && (
                              <span style={chip}>
                                slug: <strong>{org.slug}</strong>
                              </span>
                            )}
                            {created && (
                              <span style={chip}>criada em {created}</span>
                            )}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <select
                            value={org.tipo ?? ""}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                              handleOrgFieldChange(
                                org.id,
                                "tipo",
                                e.target.value
                              )
                            }
                            style={{ ...selectStyle, fontSize: 11 }}
                          >
                            <option value="">—</option>
                            <option value="universidade">Universidade</option>
                            <option value="empresa">Empresa</option>
                          </select>
                        </td>

                        <td style={tdStyle}>
                          <span style={chipStrong}>
                            {totalUsers}
                            {contracted
                              ? ` / ${contracted} contratados`
                              : " utilizadores"}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          <span style={chipStrong}>{totalAds} anúncios</span>
                        </td>

                        <td style={tdStyle}>
                          {org.is_active ? (
                            <span style={statusBadgeActive}>Ativa</span>
                          ) : (
                            <span style={statusBadgeInactive}>Inativa</span>
                          )}
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            <button
                              type="button"
                              style={secondaryButton}
                              onClick={() => setSelectedOrgId(org.id)}
                            >
                              {isSelected ? "Selecionada" : "Ver detalhes"}
                            </button>
                            <button
                              type="button"
                              style={subtleButton}
                              onClick={() => toggleOrgActive(org)}
                            >
                              {org.is_active ? "Inativar" : "Ativar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {error && <p style={errorText}>{error}</p>}
          {success && <p style={successText}>{success}</p>}
        </section>

        {/* CRIAR ORGANIZAÇÃO */}
        <section style={cardStyle}>
          <h2 style={cardTitleStyle}>Criar nova organização</h2>
          <p style={smallText}>
            Define o nome, o tipo e o slug (URL) da instituição. O slug deve ser
            único.
          </p>

          <form onSubmit={handleCreateOrg}>
            <div style={fieldStyle}>
              <label htmlFor="org-nome" style={labelStyle}>
                Nome da organização
              </label>
              <input
                id="org-nome"
                type="text"
                value={orgNome}
                onChange={(e) => {
                  const v = e.target.value;
                  setOrgNome(v);
                  if (!orgSlug) setOrgSlug(gerarSlugBase(v));
                }}
                placeholder="Ex.: Egas Moniz, Universidade X, Empresa Y"
                style={inputStyle}
                required
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="org-tipo" style={labelStyle}>
                Tipo
              </label>
              <select
                id="org-tipo"
                value={orgTipo}
                onChange={(e) =>
                  setOrgTipo(
                    e.target.value === "empresa" ? "empresa" : "universidade"
                  )
                }
                style={selectStyle}
              >
                <option value="universidade">Universidade</option>
                <option value="empresa">Empresa</option>
              </select>
            </div>

            <div style={fieldStyle}>
              <label htmlFor="org-slug" style={labelStyle}>
                Slug (URL)
              </label>
              <input
                id="org-slug"
                type="text"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value.toLowerCase())}
                placeholder="ex: egas-moniz, universidade-x..."
                style={inputStyle}
                required
              />
              <p style={smallText}>
                Usado na URL e como identificador interno. Apenas letras,
                números e hífen.
              </p>
            </div>

            <div style={buttonRow}>
              <button
                type="submit"
                style={creatingOrg ? primaryButtonDisabled : primaryButton}
                disabled={creatingOrg}
              >
                {creatingOrg ? "A criar…" : "Criar organização"}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* LINHA 2: DETALHES + UTILIZADORES */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 2fr)",
          gap: 16,
          marginTop: 16,
          alignItems: "flex-start",
        }}
      >
        {/* DETALHES / CONTRATO */}
        <section style={cardStyle}>
          <h2 style={cardTitleStyle}>Detalhes da organização</h2>

          {!selectedOrg ? (
            <p style={smallText}>
              Clica numa organização na tabela para veres e editares contrato,
              contacto e limites de utilizadores.
            </p>
          ) : (
            <>
              <p style={smallText}>
                <strong>{selectedOrg.name ?? "(sem nome)"}</strong>
                {selectedOrg.slug && (
                  <>
                    {" "}
                    · <code>{selectedOrg.slug}</code>
                  </>
                )}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <div style={fieldStyle}>
                  <label style={labelStyle}>Tipo de contrato</label>
                  <input
                    type="text"
                    value={selectedOrg.contract_type ?? ""}
                    onChange={(e) =>
                      handleOrgFieldChange(
                        selectedOrg.id,
                        "contract_type",
                        e.target.value
                      )
                    }
                    style={inputStyle}
                    placeholder="Ex.: anual, mensal, piloto…"
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Utilizadores contratados</label>
                  <input
                    type="number"
                    min={0}
                    value={contractedUsers ?? ""}
                    onChange={(e) =>
                      handleOrgFieldChange(
                        selectedOrg.id,
                        "contract_seats",
                        e.target.value
                      )
                    }
                    style={inputStyle}
                    placeholder="Ex.: 1000"
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Valor</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedOrg.contract_value ?? ""}
                      onChange={(e) =>
                        handleOrgFieldChange(
                          selectedOrg.id,
                          "contract_value",
                          e.target.value
                        )
                      }
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="Ex.: 500"
                    />
                    <input
                      type="text"
                      value={selectedOrg.contract_currency ?? "EUR"}
                      onChange={(e) =>
                        handleOrgFieldChange(
                          selectedOrg.id,
                          "contract_currency",
                          e.target.value
                        )
                      }
                      style={{ ...inputStyle, width: 70 }}
                    />
                  </div>
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Validade (fim)</label>
                  <input
                    type="date"
                    value={
                      selectedOrg.contract_end
                        ? selectedOrg.contract_end.slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      handleOrgFieldChange(
                        selectedOrg.id,
                        "contract_end",
                        e.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* BARRA DE PROGRESSO */}
              <div style={{ marginTop: 12 }}>
                <label style={{ ...labelStyle, display: "block" }}>
                  Utilização de utilizadores
                </label>
                <div
                  style={{
                    marginTop: 4,
                    width: "100%",
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: "#e5e7eb",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      borderRadius: 999,
                      backgroundColor: "#111827",
                      transition: "width 0.2s ease-out",
                    }}
                  />
                </div>
                <p style={{ ...smallText, marginTop: 4 }}>
                  {contractedUsers
                    ? `${currentUsersForBar} / ${contractedUsers} utilizadores`
                    : `${currentUsersForBar} utilizadores (nenhum limite de contrato definido)`}
                </p>
              </div>

              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid #e5e7eb",
                  margin: "12px 0",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                <div style={fieldStyle}>
                  <label style={labelStyle}>Pessoa de contacto</label>
                  <input
                    type="text"
                    value={selectedOrg.contact_name ?? ""}
                    onChange={(e) =>
                      handleOrgFieldChange(
                        selectedOrg.id,
                        "contact_name",
                        e.target.value
                      )
                    }
                    style={inputStyle}
                    placeholder="Nome"
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Telefone</label>
                  <input
                    type="tel"
                    value={selectedOrg.contact_phone ?? ""}
                    onChange={(e) =>
                      handleOrgFieldChange(
                        selectedOrg.id,
                        "contact_phone",
                        e.target.value
                      )
                    }
                    style={inputStyle}
                    placeholder="Telefone"
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={selectedOrg.contact_email ?? ""}
                    onChange={(e) =>
                      handleOrgFieldChange(
                        selectedOrg.id,
                        "contact_email",
                        e.target.value
                      )
                    }
                    style={inputStyle}
                    placeholder="Email"
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Notas internas</label>
                  <textarea
                    value={selectedOrg.contract_notes ?? ""}
                    onChange={(e) =>
                      handleOrgFieldChange(
                        selectedOrg.id,
                        "contract_notes",
                        e.target.value
                      )
                    }
                    style={textareaStyle}
                    placeholder="Observações sobre o contrato, upgrades, renegociações…"
                  />
                </div>
              </div>

              {/* MÓDULOS DA PLATAFORMA */}
              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid #e5e7eb",
                  margin: "12px 0",
                }}
              />

              <div>
                <label style={labelStyle}>Módulos ativos</label>
                <div style={modulesRowStyle}>
                  <button
                    type="button"
                    onClick={() =>
                      toggleOrgModule(selectedOrg.id, "module_esg_premium")
                    }
                    style={
                      selectedOrg.module_esg_premium
                        ? modulePillActive
                        : modulePillBase
                    }
                  >
                    ESG &amp; relatórios avançados
                  </button>
                </div>
                <p style={smallText}>
                  Quando o módulo está cinzento, a organização não vê essas
                  funcionalidades. Quando está verde, fica disponível para os
                  admins dessa conta.
                </p>
              </div>

              <div style={buttonRow}>
                <button
                  type="button"
                  style={
                    savingOrgId === selectedOrg.id
                      ? primaryButtonDisabled
                      : primaryButton
                  }
                  disabled={savingOrgId === selectedOrg.id}
                  onClick={() => handleSaveOrg(selectedOrg)}
                >
                  {savingOrgId === selectedOrg.id
                    ? "A guardar…"
                    : "Guardar alterações"}
                </button>
              </div>
            </>
          )}
        </section>

        {/* UTILIZADORES */}
        <section style={cardStyle}>
          <h2 style={cardTitleStyle}>Utilizadores da organização</h2>

          {!selectedOrg ? (
            <p style={smallText}>
              Seleciona uma organização na tabela para gerir os utilizadores,
              admins e bloqueios.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <p style={smallText}>
                  Total: <strong>{orgMembers.length}</strong> · Admins:{" "}
                  <strong>{totalAdmins}</strong> · Bloqueados:{" "}
                  <strong>{totalBlocked}</strong>
                </p>
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  style={{ ...inputStyle, maxWidth: 260 }}
                  placeholder="Pesquisar nome, email ou contacto…"
                />
              </div>

              {membersLoading ? (
                <p style={{ fontSize: 13 }}>A carregar utilizadores…</p>
              ) : filteredMembers.length === 0 ? (
                <p style={{ fontSize: 13, color: "#6b7280" }}>
                  Nenhum utilizador associado a esta organização.
                </p>
              ) : (
                <div style={{ maxHeight: 260, overflowY: "auto" }}>
                  <table style={miniTableStyle}>
                    <thead>
                      <tr>
                        <th style={miniThStyle}>Nome</th>
                        <th style={miniThStyle}>Email</th>
                        <th style={miniThStyle}>Contacto</th>
                        <th style={miniThStyle}>Perfil</th>
                        <th style={miniThStyle}>Estado</th>
                        <th style={miniThStyle}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((m) => {
                        const name = m.profile?.nome ?? "Sem nome";
                        const email = m.profile?.email ?? "Sem email";
                        const contacto = m.profile?.contacto ?? "—";
                        const role = m.role ?? "user";
                        const blocked = !!m.is_blocked;

                        return (
                          <tr key={m.user_id}>
                            <td style={miniTdStyle}>{name}</td>
                            <td style={miniTdStyle}>{email}</td>
                            <td style={miniTdStyle}>{contacto}</td>
                            <td style={miniTdStyle}>
                              <select
                                value={role}
                                onChange={(e) =>
                                  handleMemberRoleChange(m, e.target.value)
                                }
                                style={{
                                  ...selectStyle,
                                  fontSize: 11,
                                  padding: "4px 6px",
                                }}
                                disabled={updatingMemberId === m.user_id}
                              >
                                <option value="user">Membro</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td style={miniTdStyle}>
                              {blocked ? (
                                <span style={statusBadgeInactive}>
                                  Bloqueado
                                </span>
                              ) : (
                                <span style={statusBadgeActive}>Ativo</span>
                              )}
                            </td>
                            <td style={miniTdStyle}>
                              <button
                                type="button"
                                style={secondaryButton}
                                onClick={() => toggleMemberBlocked(m)}
                                disabled={updatingMemberId === m.user_id}
                              >
                                {blocked ? "Desbloquear" : "Bloquear"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
