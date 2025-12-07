"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Anuncio = {
  id: number;
  titulo: string;
  preco: number | null;
  descricao: string | null;
  tipo: string | null;
  imagens: string[] | null;
  status: string;
  criado_em: string | null;
  venda_status: string | null;
};

// Paleta base da marca
const PRIMARY = "#1bb5b8";
const PRIMARY_DARK = "#0f8a8c";
const PRIMARY_SOFT = "#e0f7f8";
const BORDER_SOFT = "#b5edf0";

const titleStyle = {
  fontSize: "20px",
  fontWeight: 600,
  marginBottom: "16px",
  color: PRIMARY_DARK,
} as const;

const controlsRowStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
  marginBottom: "20px",
  alignItems: "center",
} as const;

const searchInputStyle = {
  flex: 1,
  minWidth: "180px",
  padding: "8px 12px",
  borderRadius: "999px",
  border: `1px solid ${BORDER_SOFT}`,
  fontSize: "14px",
  backgroundColor: "#f9fafb",
} as const;

const selectStyle = {
  padding: "8px 10px",
  borderRadius: "999px",
  border: `1px solid ${BORDER_SOFT}`,
  fontSize: "14px",
  backgroundColor: "#ffffff",
} as const;

const favToggleStyle = {
  padding: "8px 12px",
  borderRadius: "999px",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: BORDER_SOFT,
  fontSize: "13px",
  backgroundColor: PRIMARY_SOFT,
  cursor: "pointer",
  color: PRIMARY_DARK,
  transition: "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease",
} as const;

const favToggleActiveStyle = {
  ...favToggleStyle,
  backgroundColor: PRIMARY_DARK,
  color: "#ffffff",
  borderColor: PRIMARY_DARK,
} as const;

const emptyMsgStyle = {
  marginTop: "24px",
  fontSize: "16px",
  color: "#6b7280",
} as const;

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: "20px",
} as const;

const cardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "16px",
  boxShadow: "0 18px 40px rgba(27, 181, 184, 0.16)", // sombra teal
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  position: "relative" as const,
  border: `1px solid ${BORDER_SOFT}`,
} as const;

const imageWrapperStyle = {
  width: "100%",
  height: "150px",
  marginBottom: "8px",
  position: "relative" as const,
  borderRadius: "12px",
  overflow: "hidden",
} as const;

const imgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
} as const;

const placeholderStyle = {
  width: "100%",
  height: "100%",
  background:
    "linear-gradient(135deg, rgba(27,181,184,0.08), rgba(15,138,140,0.16))",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: PRIMARY_DARK,
  fontSize: "13px",
  fontWeight: 500,
} as const;

const heartButtonStyle = {
  position: "absolute" as const,
  top: "8px",
  right: "8px",
  width: "28px",
  height: "28px",
  borderRadius: "999px",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  backgroundColor: "rgba(15, 23, 42, 0.68)",
  backdropFilter: "blur(4px)",
} as const;

const heartIconStyle = {
  fontSize: "16px",
  color: "#e5e7eb",
} as const;

const heartIconActiveStyle = {
  ...heartIconStyle,
  color: "#f97316",
} as const;

const cardTitleStyle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#111827",
} as const;

const badgeRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: "4px",
} as const;

const tipoBadgeStyle = {
  padding: "3px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  textTransform: "uppercase" as const,
  backgroundColor: PRIMARY_SOFT,
  color: PRIMARY_DARK,
  fontWeight: 600,
} as const;

const priceStyle = {
  color: PRIMARY,
  fontWeight: 700,
  fontSize: "14px",
} as const;

const descStyle = {
  fontSize: "13px",
  color: "#4b5563",
  marginTop: "4px",
} as const;

const smallInfoStyle = {
  marginTop: "6px",
  fontSize: "11px",
  color: "#9ca3af",
} as const;

export default function Home() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<
    "todos" | "venda" | "troca" | "aluguel" | "doacao"
  >("todos");
  const [orderBy, setOrderBy] = useState<"recentes" | "precoAsc" | "precoDesc">(
    "recentes"
  );
  const [favorites, setFavorites] = useState<number[]>([]);
  const [onlyFav, setOnlyFav] = useState(false);

  // carregar anúncios aprovados e não vendidos
  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("anuncios")
        .select("*")
        .eq("status", "approved")
        .or(
          "venda_status.is.null,venda_status.eq.disponivel,venda_status.eq.reservado"
        )
        .order("criado_em", { ascending: false });

      if (error) {
        console.error(error);
        setError("Erro ao carregar anúncios.");
        setLoading(false);
        return;
      }

      setAnuncios((data ?? []) as Anuncio[]);
      setLoading(false);
    }

    carregar();
  }, []);

  // carregar favoritos do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("campusmarket_favorites");
      if (raw) {
        const ids = JSON.parse(raw) as number[];
        setFavorites(ids);
      }
    } catch {
      // ignora erro de parse
    }
  }, []);

  // salvar favoritos sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(
        "campusmarket_favorites",
        JSON.stringify(favorites)
      );
    } catch {
      // se falhar, só não salva
    }
  }, [favorites]);

  function toggleFavorite(id: number) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const listaFiltrada = useMemo(() => {
    let lista = [...anuncios];

    if (search.trim()) {
      const q = search.toLowerCase();
      lista = lista.filter((a) => {
        const t = a.titulo?.toLowerCase() ?? "";
        const d = a.descricao?.toLowerCase() ?? "";
        return t.includes(q) || d.includes(q);
      });
    }

    if (tipoFilter !== "todos") {
      lista = lista.filter((a) => a.tipo === tipoFilter);
    }

    if (onlyFav) {
      lista = lista.filter((a) => favorites.includes(a.id));
    }

    if (orderBy === "precoAsc") {
      lista.sort((a, b) => {
        const pa = a.preco ?? Infinity;
        const pb = b.preco ?? Infinity;
        return pa - pb;
      });
    } else if (orderBy === "precoDesc") {
      lista.sort((a, b) => {
        const pa = a.preco ?? -Infinity;
        const pb = b.preco ?? -Infinity;
        return pb - pa;
      });
    } else {
      lista.sort((a, b) => {
        const da = a.criado_em ? new Date(a.criado_em).getTime() : 0;
        const db = b.criado_em ? new Date(b.criado_em).getTime() : 0;
        return db - da;
      });
    }

    return lista;
  }, [anuncios, search, tipoFilter, orderBy, onlyFav, favorites]);

  return (
    <>
      <h2 style={titleStyle}>Anúncios</h2>

      {/* Barra de pesquisa + filtros */}
      <div style={controlsRowStyle}>
        <input
          type="text"
          placeholder="Pesquisar por título ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInputStyle}
        />

        <select
          value={tipoFilter}
          onChange={(e) =>
            setTipoFilter(
              e.target.value as
                | "todos"
                | "venda"
                | "troca"
                | "aluguel"
                | "doacao"
            )
          }
          style={selectStyle}
        >
          <option value="todos">Todos os tipos</option>
          <option value="venda">Venda</option>
          <option value="troca">Troca</option>
          <option value="aluguel">Aluguel</option>
          <option value="doacao">Doação</option>
        </select>

        <select
          value={orderBy}
          onChange={(e) =>
            setOrderBy(
              e.target.value as "recentes" | "precoAsc" | "precoDesc"
            )
          }
          style={selectStyle}
        >
          <option value="recentes">Mais recentes</option>
          <option value="precoAsc">Menor preço</option>
          <option value="precoDesc">Maior preço</option>
        </select>

        <button
          type="button"
          style={onlyFav ? favToggleActiveStyle : favToggleStyle}
          onClick={() => setOnlyFav((prev) => !prev)}
        >
          ♥ Só favoritos
        </button>
      </div>

      {loading && <p style={emptyMsgStyle}>Carregando anúncios...</p>}

      {error && <p style={emptyMsgStyle}>{error}</p>}

      {!loading && !error && listaFiltrada.length === 0 && (
        <p style={emptyMsgStyle}>
          Nenhum anúncio encontrado com os filtros atuais.
        </p>
      )}

      {!loading && !error && listaFiltrada.length > 0 && (
        <div style={gridStyle}>
          {listaFiltrada.map((a) => {
            const primeiraImagem =
              a.imagens && a.imagens.length > 0 ? a.imagens[0] : null;

            const isFav = favorites.includes(a.id);

            return (
              <article key={a.id} style={cardStyle} className="hover-card">
                <Link
                  href={`/anuncio/${a.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div style={imageWrapperStyle}>
                    {primeiraImagem ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={primeiraImagem}
                        alt={a.titulo}
                        style={imgStyle}
                      />
                    ) : (
                      <div style={placeholderStyle}>Sem imagem</div>
                    )}

                    <button
                      type="button"
                      style={heartButtonStyle}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(a.id);
                      }}
                    >
                      <span
                        style={
                          isFav ? heartIconActiveStyle : heartIconStyle
                        }
                      >
                        ♥
                      </span>
                    </button>
                  </div>

                  <h3 style={cardTitleStyle}>{a.titulo}</h3>

                  <div style={badgeRowStyle}>
                    {a.tipo && (
                      <span style={tipoBadgeStyle}>
                        {a.tipo.toUpperCase()}
                      </span>
                    )}

                    {a.preco !== null && (
                      <span style={priceStyle}>{a.preco}€</span>
                    )}
                  </div>

                  {a.descricao && <p style={descStyle}>{a.descricao}</p>}

                  {a.criado_em && (
                    <p style={smallInfoStyle}>
                      Criado em{" "}
                      {new Date(a.criado_em).toLocaleDateString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
