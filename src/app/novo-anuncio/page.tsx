"use client";

import {
  useEffect,
  useState,
  useRef,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const wrapperStyle = {
  maxWidth: "720px",
  margin: "24px auto",
  padding: "24px",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 2px 10px rgba(15, 23, 42, 0.08)",
} as const;

const titleStyle = {
  fontSize: "22px",
  fontWeight: 700,
  marginBottom: "18px",
} as const;

const fieldStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "6px",
  marginBottom: "16px",
};

const labelStyle = {
  fontSize: "14px",
  fontWeight: 500,
} as const;

const helperStyle = {
  fontSize: "12px",
  color: "#6b7280",
} as const;

const inputStyle = {
  padding: "9px 11px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
} as const;

const textareaStyle = {
  ...inputStyle,
  minHeight: "90px",
  resize: "vertical" as const,
};

const selectStyle = {
  ...inputStyle,
} as const;

const contactBoxStyle = {
  marginTop: "4px",
  padding: "12px 14px",
  borderRadius: "10px",
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  fontSize: "13px",
} as const;

const contactTitleStyle = {
  fontWeight: 600,
  marginBottom: "6px",
} as const;

const contactHintStyle = {
  marginTop: "6px",
  fontSize: "12px",
  color: "#6b7280",
} as const;

// --------- GALERIA DE SLOTS ---------

const MAX_IMAGES = 4;

const slotsWrapperStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(70px, 1fr))",
  gap: "10px",
  marginTop: "8px",
} as const;

const slotStyle = {
  position: "relative" as const,
  width: "100%",
  paddingBottom: "100%", // quadrado
  borderRadius: "12px",
  overflow: "hidden",
  backgroundColor: "#f9fafb",
  border: "1px dashed #cbd5f5",
  cursor: "pointer",
  transition: "border-color 0.15s ease, background-color 0.15s ease",
} as const;

const slotInnerEmptyStyle = {
  position: "absolute" as const,
  inset: 0,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  color: "#9ca3af",
  fontSize: "11px",
} as const;

const slotPlusStyle = {
  width: "26px",
  height: "26px",
  borderRadius: "999px",
  border: "1px dashed #9ca3af",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  lineHeight: 1,
} as const;

const slotPreviewImgStyle = {
  position: "absolute" as const,
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
} as const;

const slotBadgeStyle = {
  position: "absolute" as const,
  left: "6px",
  top: "6px",
  padding: "2px 6px",
  borderRadius: "999px",
  backgroundColor: "rgba(6, 95, 70, 0.9)",
  color: "#f9fafb",
  fontSize: "10px",
  fontWeight: 600,
} as const;

const slotRemoveStyle = {
  position: "absolute" as const,
  right: "6px",
  top: "6px",
  width: "18px",
  height: "18px",
  borderRadius: "999px",
  border: "none",
  backgroundColor: "rgba(15, 23, 42, 0.8)",
  color: "#f9fafb",
  fontSize: "11px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
} as const;

// --- PRÉ-VISUALIZAÇÃO ---

const previewSectionStyle = {
  marginTop: "20px",
  paddingTop: "16px",
  borderTop: "1px solid #e5e7eb",
} as const;

const previewTitleStyle = {
  fontSize: "14px",
  fontWeight: 600,
  marginBottom: "10px",
  color: "#374151",
} as const;

const previewCardStyle = {
  display: "grid",
  gridTemplateColumns: "120px minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "12px",
  borderRadius: "14px",
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
} as const;

const previewImageBoxStyle = {
  width: "100%",
  borderRadius: "10px",
  overflow: "hidden",
  backgroundColor: "#e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  color: "#9ca3af",
} as const;

const previewMainImgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
} as const;

const previewContentStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "6px",
} as const;

const previewTitleTextStyle = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#111827",
} as const;

const previewBadgeRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap" as const,
} as const;

const previewTipoBadgeStyle = {
  padding: "3px 9px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 600,
  backgroundColor: "#ecfdf5",
  color: "#047857",
} as const;

const previewPriceStyle = {
  fontSize: "16px",
  fontWeight: 700,
  color: "#111827",
} as const;

const previewDescStyle = {
  fontSize: "12px",
  color: "#4b5563",
  maxHeight: "40px",
  overflow: "hidden",
} as const;

const previewHintStyle = {
  marginTop: "6px",
  fontSize: "11px",
  color: "#9ca3af",
} as const;

// --- BOTÕES / MENSAGENS ---

const buttonStyle = {
  marginTop: "16px",
  padding: "11px 18px",
  borderRadius: "999px",
  border: "none",
  backgroundColor: "#111827",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  width: "100%",
} as const;

const buttonDisabledStyle = {
  ...buttonStyle,
  opacity: 0.6,
  cursor: "default",
};

const successStyle = {
  marginTop: "10px",
  fontSize: "14px",
  color: "#16a34a",
} as const;

const errorStyle = {
  marginTop: "10px",
  fontSize: "14px",
  color: "#dc2626",
} as const;

export default function NovoAnuncioPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [preco, setPreco] = useState("");
  const [tipo, setTipo] = useState<"venda" | "troca" | "aluguel" | "doacao">(
    "venda"
  );
  const [descricao, setDescricao] = useState("");

  // contacto (puxado do perfil)
  const [contactoNome, setContactoNome] = useState("");
  const [contactoDepartamento, setContactoDepartamento] = useState("");
  const [contactoTelefone, setContactoTelefone] = useState("");

  // organização associada ao utilizador (para org_id em anuncios)
  const [orgId, setOrgId] = useState<number | null>(null);

  // arquivos por slot (até MAX_IMAGES)
  const [files, setFiles] = useState<(File | null)[]>(
    () => new Array(MAX_IMAGES).fill(null)
  );
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarPerfilEOrganizacao() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      const userId = userData.user.id;

      // PERFIL
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("nome, departamento, contacto")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error(profileError);
      } else if (profile) {
        setContactoNome(profile.nome || "");
        setContactoDepartamento(profile.departamento || "");
        setContactoTelefone(profile.contacto || "");
      }

      // ORGANIZAÇÃO (tabela user_organizations)
      const { data: membership, error: memberError } = await supabase
        .from("user_organizations")
        .select("organization_id")
        .eq("user_id", userId)
        .eq("is_blocked", false)
        .order("created_at", { ascending: true })
        .maybeSingle();

      if (memberError) {
        console.error(memberError);
      } else if (membership?.organization_id != null) {
        setOrgId(membership.organization_id);
      }
    }

    carregarPerfilEOrganizacao();
  }, [router]);

  // ------------ IMAGENS (SLOTS) ------------

  function handleSlotClick(index: number) {
    setActiveSlot(index);
    fileInputRef.current?.click();
  }

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || activeSlot === null) return;

    setFiles((prev) => {
      const next = [...prev];
      next[activeSlot] = file;
      return next;
    });

    // limpa input para poder escolher a mesma imagem em seguida se quiser
    e.target.value = "";
  }

  function handleRemoveSlot(index: number) {
    setFiles((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  // lista só com arquivos preenchidos (na ordem dos slots)
  const filledFiles: File[] = files.filter(
    (f): f is File => f !== null
  );

  async function uploadImagens(): Promise<string[]> {
    if (filledFiles.length === 0) return [];

    const urls: string[] = [];

    // aqui daria para comprimir imagens com alguma lib (ex.: browser-image-compression)
    // antes de fazer o upload, mas por enquanto vamos direto.
    for (const file of filledFiles) {
      const ext = file.name.split(".").pop();
      const uniqueName =
        `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error } = await supabase.storage
        .from("anuncios")
        .upload(uniqueName, file);

      if (error || !data) {
        console.error(error);
        throw new Error("Erro ao subir imagem.");
      }

      const { data: publicData } = supabase.storage
        .from("anuncios")
        .getPublicUrl(data.path);

      urls.push(publicData.publicUrl);
    }

    return urls;
  }

  // ------------ SUBMIT ------------

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);
    setErro(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setErro("Precisa estar autenticado para criar anúncios.");
        setLoading(false);
        return;
      }

      // regra: se for venda, preço é obrigatório
      if (tipo === "venda" && preco.trim() === "") {
        setErro("Para anúncios de venda, o preço é obrigatório.");
        setLoading(false);
        return;
      }

      const precoNumber =
        preco.trim() === "" ? null : Number(preco.replace(",", "."));

      const imagensUrls = await uploadImagens();

      const { error } = await supabase.from("anuncios").insert([
        {
          titulo,
          preco: precoNumber,
          tipo,
          descricao: descricao || null,
          imagens: imagensUrls,
          status: "pending", // moderação
          venda_status: "disponivel", // fluxo de venda
          owner_id: userData.user.id,
          contacto_nome: contactoNome || null,
          contacto_departamento: contactoDepartamento || null,
          contacto_telefone: contactoTelefone || null,
          org_id: orgId ?? null,
        },
      ]);

      if (error) {
        console.error(error);
        throw new Error("Erro ao criar anúncio.");
      }

      setMensagem("Anúncio criado e enviado para aprovação.");
      setTitulo("");
      setPreco("");
      setDescricao("");
      setFiles(new Array(MAX_IMAGES).fill(null));

      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err) {
      console.error(err);
      setErro("Ocorreu um erro ao salvar o anúncio.");
    } finally {
      setLoading(false);
    }
  }

  const temContacto =
    contactoNome.trim() !== "" || contactoTelefone.trim() !== "";

  // Dados para a pré-visualização
  const tipoLabel: Record<string, string> = {
    venda: "Venda",
    troca: "Troca",
    aluguel: "Aluguel",
    doacao: "Doação",
  };

  const tipoLabelPreview = tipoLabel[tipo] ?? tipo;
  const precoPreview =
    preco.trim() !== "" ? `${preco.trim()}€` : "Sem preço definido";
  const descPreview =
    descricao.trim().length > 0
      ? descricao.trim()
      : "A descrição que escrever aqui vai aparecer nesta área.";

  const showPreview =
    titulo.trim() !== "" ||
    preco.trim() !== "" ||
    descricao.trim() !== "" ||
    filledFiles.length > 0;

  return (
    <div style={wrapperStyle}>
      <h2 style={titleStyle}>Criar novo anúncio</h2>

      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label htmlFor="titulo" style={labelStyle}>
            Título *
          </label>
          <input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            style={inputStyle}
            placeholder="Ex: Cadeira de escritório, Kit de livros, iPhone 12..."
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="tipo" style={labelStyle}>
            Tipo de anúncio *
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) =>
              setTipo(
                e.target.value as "venda" | "troca" | "aluguel" | "doacao"
              )
            }
            style={selectStyle}
          >
            <option value="venda">Venda</option>
            <option value="troca">Troca</option>
            <option value="aluguel">Aluguel</option>
            <option value="doacao">Doação</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="preco" style={labelStyle}>
            Preço {tipo === "venda" && <span>*</span>}
          </label>
          <input
            id="preco"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            style={inputStyle}
            placeholder={
              tipo === "venda" ? "Ex: 120 ou 120.50" : "Opcional (pode deixar vazio)"
            }
            required={tipo === "venda"}
          />
          <span style={helperStyle}>
            {tipo === "venda"
              ? "Para anúncios de venda, o preço é obrigatório."
              : "Para anúncios de troca, doação ou sem preço, pode deixar em branco."}
          </span>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="descricao" style={labelStyle}>
            Descrição (opcional)
          </label>
          <textarea
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            style={textareaStyle}
            placeholder="Detalhes, estado do produto, combinados, etc."
          />
        </div>

        {/* Contacto do responsável (apenas leitura, vindo do perfil) */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Contacto deste anúncio</span>
          <div style={contactBoxStyle}>
            {temContacto ? (
              <>
                <div style={contactTitleStyle}>
                  Nome: <span>{contactoNome || "—"}</span>
                </div>
                <div>
                  <strong>Departamento:</strong>{" "}
                  {contactoDepartamento || "—"}
                </div>
                <div>
                  <strong>Telefone / WhatsApp:</strong>{" "}
                  {contactoTelefone || "—"}
                </div>
              </>
            ) : (
              <p style={{ fontSize: "13px", color: "#6b7280" }}>
                Ainda não há dados de contacto preenchidos no seu perfil.
              </p>
            )}

            <span style={contactHintStyle}>
              Estes dados vêm do seu perfil e serão mostrados ao interessado no
              anúncio. Se estiverem em branco, atualize-os na página{" "}
              <Link
                href="/perfil"
                style={{
                  color: "#2563eb",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Perfil
              </Link>
              .
            </span>
          </div>
        </div>

        {/* IMAGENS EM SLOTS */}
        <div style={fieldStyle}>
          <span style={labelStyle}>
            Imagens (galeria – até {MAX_IMAGES} fotos)
          </span>
          <span style={helperStyle}>
            Clique nos quadrados para adicionar imagens. A primeira será a
            capa do anúncio.
          </span>

          {/* input real, mas escondido */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelected}
            style={{ display: "none" }}
          />

          <div style={slotsWrapperStyle}>
            {files.map((file, index) => (
              <div
                key={index}
                style={slotStyle}
                onClick={() => handleSlotClick(index)}
              >
                {file ? (
                  <>
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Imagem ${index + 1}`}
                      style={slotPreviewImgStyle}
                    />
                    {index === 0 && (
                      <span style={slotBadgeStyle}>Principal</span>
                    )}
                    <button
                      type="button"
                      style={slotRemoveStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSlot(index);
                      }}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <div style={slotInnerEmptyStyle}>
                    <div style={slotPlusStyle}>+</div>
                    <span>Foto {index + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PRÉ-VISUALIZAÇÃO DO ANÚNCIO */}
        {showPreview && (
          <section style={previewSectionStyle}>
            <h3 style={previewTitleStyle}>Pré-visualização do anúncio</h3>
            <div style={previewCardStyle}>
              <div style={previewImageBoxStyle}>
                {filledFiles[0] ? (
                  <img
                    src={URL.createObjectURL(filledFiles[0])}
                    alt="Pré-visualização"
                    style={previewMainImgStyle}
                  />
                ) : (
                  <span>Sem imagem</span>
                )}
              </div>

              <div style={previewContentStyle}>
                <div style={previewTitleTextStyle}>
                  {titulo.trim() !== ""
                    ? titulo
                    : "O título que escrever aqui aparece nesta zona."}
                </div>

                <div style={previewBadgeRowStyle}>
                  <span style={previewTipoBadgeStyle}>
                    {tipoLabelPreview}
                  </span>
                  {preco.trim() !== "" && (
                    <span style={previewPriceStyle}>{precoPreview}</span>
                  )}
                </div>

                <p style={previewDescStyle}>{descPreview}</p>
              </div>
            </div>
            <p style={previewHintStyle}>
              Esta é uma pré-visualização aproximada. O anúncio final seguirá o
              mesmo estilo visual da listagem interna do CampusMarket.
            </p>
          </section>
        )}

        <button
          type="submit"
          style={loading ? buttonDisabledStyle : buttonStyle}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar anúncio"}
        </button>

        {mensagem && <p style={successStyle}>{mensagem}</p>}
        {erro && <p style={errorStyle}>{erro}</p>}
      </form>
    </div>
  );
}
