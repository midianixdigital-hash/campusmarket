"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrganizationRow = {
  id: number;
  name: string | null;
  tipo: string | null;
  slug: string | null;
  is_active: boolean | null;
  contract_type: string | null;
  contract_start: string | null;
  contract_end: string | null;
  contract_value: number | null;
  contract_currency: string | null;
  contract_seats: number | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

type OrganizationStatsRow = {
  org_id: number;
  total_users: number;
  total_ads: number;
  ads_vendidos: number;
  contract_seats: number | null;
};

type OrgWithStats = {
  org: OrganizationRow;
  stats: OrganizationStatsRow | null;
};

type MemberProfile = {
  id: string;
  nome: string | null;
  email: string | null;
  contacto: string | null;
};

type OrgMember = {
  user_id: string;
  organization_id: number;
  role: string | null;
  is_blocked: boolean | null;
  profile: MemberProfile | null;
};

const pageWrapper: CSSProperties = {
  maxWidth: 1200,
  margin: "24px auto",
  padding: "16px",
  borderRadius: 20,
  background:
    "linear-gradient(135deg, #eff6ff 0%, #fdf2ff 30%, #ecfdf5 100%)",
};

const titleStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 4,
};

const subtitleStyle: CSSProperties = {
  fontSize: 14,
  color: "#4b5563",
  marginBottom: 20,
};

const layoutGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 2fr)",
  gap: 16,
  alignItems: "flex-start",
};

const cardBase: CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
  border: "1px solid #e5e7eb",
};

const cardTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 10,
};

const smallText: CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
};

const orgList: CSSProperties = {
  maxHeight: 520,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const orgCardBase: CSSProperties = {
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  padding: 10,
  backgroundColor: "#f9fafb",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const orgCardSelected: CSSProperties = {
  ...orgCardBase,
  borderColor: "#0f766e",
  backgroundColor: "#ecfdf5",
};

const badge: CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  backgroundColor: "#f3f4f6",
  color: "#4b5563",
  marginRight: 4,
  marginBottom: 2,
};

const badgeStrong: CSSProperties = {
  ...badge,
  backgroundColor: "#e5e7eb",
  fontWeight: 600,
};

const statusActive: CSSProperties = {
  ...badgeStrong,
  backgroundColor: "#dcfce7",
  color: "#166534",
};

const statusInactive: CSSProperties = {
  ...badgeStrong,
  backgroundColor: "#fee2e2",
  color: "#b91c1c",
};

const metricsRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 8,
};

const metricCard: CSSProperties = {
  flex: "1 1 120px",
  minWidth: 0,
  borderRadius: 12,
  padding: "8px 10px",
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
};

const metricLabel: CSSProperties = {
  fontSize: 11,
  color: "#6b7280",
};

const metricValue: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#111827",
};

const fieldGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  marginTop: 12,
};

const fieldLabel: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
};

const fieldValueBox: CSSProperties = {
  marginTop: 4,
  fontSize: 13,
  color: "#111827",
};

const tableWrapper: CSSProperties = {
  maxHeight: 340,
  overflowY: "auto",
};

const miniTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const miniTh: CSSProperties = {
  textAlign: "left",
  padding: "6px 4px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
};

const miniTd: CSSProperties = {
  padding: "4px 4px",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
};

const selectStyle: CSSProperties = {
  fontSize: 12,
  padding: "4px 6px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  backgroundColor: "#ffffff",
};

const pillButton: CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  backgroundColor: "#f9fafb",
  fontSize: 11,
  cursor: "pointer",
};

const pillButtonDanger: CSSProperties = {
  ...pillButton,
  borderColor: "#fecaca",
  backgroundColor: "#fef2f2",
  color: "#b91c1c",
};

const errorText: CSSProperties = {
  fontSize: 13,
  color: "#dc2626",
  marginTop: 8,
};

export default function SuperAdminOrganizationsPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [orgs, setOrgs] = useState<OrgWithStats[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // AUTH + verifica se é global_admin
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

      setUserEmail(user.email ?? null);

      const { data: adminRow, error: adminError } = await supabase
        .from("global_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) console.error(adminError);

      setIsGlobalAdmin(!!adminRow);
      setAuthChecked(true);
    })();
  }, [router]);

  // carrega organizações + stats
  useEffect(() => {
    if (!authChecked || !isGlobalAdmin) return;

    (async () => {
      const [{ data: orgRows, error: orgError }, { data: statRows, error: statsError }] =
        await Promise.all([
          supabase.from("organizations").select("*").order("name", { ascending: true }),
          supabase.from("organization_stats").select("*"),
        ]);

      if (orgError) {
        console.error(orgError);
        setError("Não foi possível carregar as organizações.");
        return;
      }
      if (statsError) console.error(statsError);

      const statsMap = new Map<number, OrganizationStatsRow>();
      (statRows ?? []).forEach((s: any) => {
        statsMap.set(s.org_id, {
          org_id: s.org_id,
          total_users: s.total_users ?? 0,
          total_ads: s.total_ads ?? 0,
          ads_vendidos: s.ads_vendidos ?? 0,
          contract_seats: s.contract_seats ?? null,
        });
      });

      const merged: OrgWithStats[] = (orgRows ?? []).map((o: any) => ({
        org: {
          id: o.id,
          name: o.name ?? null,
          tipo: o.tipo ?? null,
          slug: o.slug ?? null,
          is_active: o.is_active ?? true,
          contract_type: o.contract_type ?? null,
          contract_start: o.contract_start ?? null,
          contract_end: o.contract_end ?? null,
          contract_value: o.contract_value ?? null,
          contract_currency: o.contract_currency ?? null,
          contract_seats: o.contract_seats ?? null,
          contact_name: o.contact_name ?? null,
          contact_email: o.contact_email ?? null,
          contact_phone: o.contact_phone ?? null,
        },
        stats: statsMap.get(o.id) ?? null,
      }));

      setOrgs(merged);
      if (merged.length > 0 && !selectedOrgId) {
        setSelectedOrgId(merged[0].org.id);
      }
    })();
  }, [authChecked, isGlobalAdmin, selectedOrgId]);

  // carrega utilizadores da org selecionada
  useEffect(() => {
    if (!selectedOrgId) {
      setMembers([]);
      return;
    }

    (async () => {
      setMembersLoading(true);
      setError(null);

      const { data: memberRows, error } = await supabase
        .from("user_organizations")
        .select("user_id, organization_id, role, is_blocked")
        .eq("organization_id", selectedOrgId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        setError("Não foi possível carregar os utilizadores.");
        setMembersLoading(false);
        return;
      }

      if (!memberRows || memberRows.length === 0) {
        setMembers([]);
        setMembersLoading(false);
        return;
      }

      const typed = memberRows as any as OrgMember[];
      const userIds = typed.map((m) => m.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, email, contacto")
        .in("id", userIds);

      if (profilesError) console.error(profilesError);

      const profileMap = new Map<string, MemberProfile>();
      (profiles ?? []).forEach((p: any) => {
        profileMap.set(p.id, {
          id: p.id,
          nome: p.nome ?? null,
          email: p.email ?? null,
          contacto: p.contacto ?? null,
        });
      });

      const mergedMembers: OrgMember[] = typed.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) ?? null,
      }));

      setMembers(mergedMembers);
      setMembersLoading(false);
    })();
  }, [selectedOrgId]);

  async function updateMemberRole(member: OrgMember, role: string) {
    setError(null);
    const { error } = await supabase
      .from("user_organizations")
      .update({ role })
      .eq("user_id", member.user_id)
      .eq("organization_id", member.organization_id);

    if (error) {
      console.error(error);
      setError("Não foi possível atualizar o perfil do utilizador.");
      return;
    }

    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === member.user_id ? { ...m, role } : m
      )
    );
  }

  async function toggleMemberBlocked(member: OrgMember) {
    setError(null);
    const newValue = !member.is_blocked;

    const { error } = await supabase
      .from("user_organizations")
      .update({ is_blocked: newValue })
      .eq("user_id", member.user_id)
      .eq("organization_id", member.organization_id);

    if (error) {
      console.error(error);
      setError("Não foi possível atualizar o estado do utilizador.");
      return;
    }

    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === member.user_id ? { ...m, is_blocked: newValue } : m
      )
    );
  }

  if (!authChecked) {
    return (
      <main style={pageWrapper}>
        <p style={{ fontSize: 14 }}>A verificar permissões…</p>
      </main>
    );
  }

  if (!isGlobalAdmin) {
    return (
      <main style={pageWrapper}>
        <h1 style={titleStyle}>Super painel</h1>
        <p style={subtitleStyle}>
          O teu utilizador{" "}
          <strong>{userEmail ?? "(sem email configurado)"}</strong> não tem
          acesso ao painel de super administração.
        </p>
      </main>
    );
  }

  const selectedOrg =
    selectedOrgId != null
      ? orgs.find((o) => o.org.id === selectedOrgId) ?? null
      : null;

  return (
    <main style={pageWrapper}>
      <h1 style={titleStyle}>Super painel</h1>
      <p style={subtitleStyle}>
        Gestão de organizações em formato de cards. Vê rapidamente os números
        principais e ajusta os utilizadores associados.
      </p>

      <div style={layoutGrid}>
        {/* Coluna esquerda: lista de organizações */}
        <section style={{ ...cardBase, paddingBottom: 12 }}>
          <h2 style={cardTitle}>Organizações</h2>
          {orgs.length === 0 ? (
            <p style={smallText}>
              Ainda não existem organizações configuradas.
            </p>
          ) : (
            <div style={orgList}>
              {orgs.map(({ org, stats }) => {
                const isSelected = org.id === selectedOrgId;
                const contracted =
                  org.contract_seats ?? stats?.contract_seats ?? null;
                const totalUsers = stats?.total_users ?? 0;
                const totalAds = stats?.total_ads ?? 0;

                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => setSelectedOrgId(org.id)}
                    style={isSelected ? orgCardSelected : orgCardBase}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {org.name ?? "(sem nome)"}
                      </span>
                      {org.is_active ? (
                        <span style={statusActive}>Ativa</span>
                      ) : (
                        <span style={statusInactive}>Inativa</span>
                      )}
                    </div>
                    <div>
                      {org.slug && (
                        <span style={badge}>slug: {org.slug}</span>
                      )}
                      {org.tipo && (
                        <span style={badge}>
                          {org.tipo === "empresa"
                            ? "Empresa"
                            : "Universidade"}
                        </span>
                      )}
                    </div>
                    <div>
                      <span style={badgeStrong}>
                        {totalUsers}
                        {contracted ? ` / ${contracted}` : ""} utilizadores
                      </span>
                      <span style={badgeStrong}>{totalAds} anúncios</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Coluna direita: resumo + utilizadores */}
        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={cardBase}>
            <h2 style={cardTitle}>Resumo da organização</h2>

            {!selectedOrg ? (
              <p style={smallText}>
                Seleciona uma organização na coluna ao lado.
              </p>
            ) : (
              <>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {selectedOrg.org.name ?? "(sem nome)"}
                </h3>
                <p style={smallText}>
                  {selectedOrg.org.slug && (
                    <>
                      <code>{selectedOrg.org.slug}</code> ·{" "}
                    </>
                  )}
                  {selectedOrg.org.tipo === "empresa"
                    ? "Empresa"
                    : "Universidade"}
                </p>

                <div style={metricsRow}>
                  <div style={metricCard}>
                    <div style={metricLabel}>Utilizadores</div>
                    <div style={metricValue}>
                      {selectedOrg.stats?.total_users ?? 0}
                    </div>
                    <div style={smallText}>
                      {selectedOrg.stats?.contract_seats
                        ? `${selectedOrg.stats.contract_seats} contratados`
                        : "sem limite configurado"}
                    </div>
                  </div>

                  <div style={metricCard}>
                    <div style={metricLabel}>Anúncios</div>
                    <div style={metricValue}>
                      {selectedOrg.stats?.total_ads ?? 0}
                    </div>
                    <div style={smallText}>
                      {selectedOrg.stats?.ads_vendidos
                        ? `${selectedOrg.stats.ads_vendidos} vendidos`
                        : "0 vendidos"}
                    </div>
                  </div>

                  <div style={metricCard}>
                    <div style={metricLabel}>Estado</div>
                    <div style={metricValue}>
                      {selectedOrg.org.is_active ? "Ativa" : "Inativa"}
                    </div>
                    <div style={smallText}>
                      Tipo{" "}
                      {selectedOrg.org.tipo === "empresa"
                        ? "empresa"
                        : "universidade"}
                    </div>
                  </div>
                </div>

                <div style={fieldGrid}>
                  <div>
                    <div style={fieldLabel}>Pessoa de contacto</div>
                    <div style={fieldValueBox}>
                      {selectedOrg.org.contact_name || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={fieldLabel}>Telefone</div>
                    <div style={fieldValueBox}>
                      {selectedOrg.org.contact_phone || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={fieldLabel}>Email</div>
                    <div style={fieldValueBox}>
                      {selectedOrg.org.contact_email || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={fieldLabel}>Tipo de contrato</div>
                    <div style={fieldValueBox}>
                      {selectedOrg.org.contract_type || "—"}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={cardBase}>
            <h2 style={cardTitle}>Utilizadores da organização</h2>

            {!selectedOrg ? (
              <p style={smallText}>
                Seleciona uma organização para ver os utilizadores.
              </p>
            ) : membersLoading ? (
              <p style={{ fontSize: 13 }}>A carregar utilizadores…</p>
            ) : members.length === 0 ? (
              <p style={{ fontSize: 13, color: "#6b7280" }}>
                Não há utilizadores associados a esta organização.
              </p>
            ) : (
              <div style={tableWrapper}>
                <table style={miniTable}>
                  <thead>
                    <tr>
                      <th style={miniTh}>Nome</th>
                      <th style={miniTh}>Email</th>
                      <th style={miniTh}>Contacto</th>
                      <th style={miniTh}>Perfil</th>
                      <th style={miniTh}>Estado</th>
                      <th style={miniTh}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const profile = m.profile;
                      const name =
                        profile?.nome ??
                        profile?.email ??
                        "Utilizador sem nome";
                      const email = profile?.email ?? "Sem email";
                      const contacto = profile?.contacto ?? "—";
                      const role = m.role ?? "user";
                      const blocked = !!m.is_blocked;

                      return (
                        <tr key={m.user_id}>
                          <td style={miniTd}>{name}</td>
                          <td style={miniTd}>{email}</td>
                          <td style={miniTd}>{contacto}</td>
                          <td style={miniTd}>
                            <select
                              value={role}
                              onChange={(e) =>
                                updateMemberRole(m, e.target.value)
                              }
                              style={selectStyle}
                            >
                              <option value="user">Membro</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td style={miniTd}>
                            {blocked ? (
                              <span style={statusInactive}>Bloqueado</span>
                            ) : (
                              <span style={statusActive}>Ativo</span>
                            )}
                          </td>
                          <td style={miniTd}>
                            <button
                              type="button"
                              style={blocked ? pillButton : pillButtonDanger}
                              onClick={() => toggleMemberBlocked(m)}
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

            {error && <p style={errorText}>{error}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
