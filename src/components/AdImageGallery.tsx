"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

type GalleryImage = {
  id: string | number;
  url: string;
};

const galleryWrapper: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const mainImageBox: CSSProperties = {
  width: "100%",
  aspectRatio: "4 / 3",
  borderRadius: 12,
  overflow: "hidden",
  backgroundColor: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const mainImgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const thumbsRow: CSSProperties = {
  display: "flex",
  gap: 8,
  overflowX: "auto",
};

const thumbBoxBase: CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 8,
  overflow: "hidden",
  border: "2px solid transparent",
  cursor: "pointer",
  flexShrink: 0,
};

const thumbImgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const placeholderText: CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
};

function extractImagesFromAdRecord(adRecord: any): GalleryImage[] {
  const images: GalleryImage[] = [];

  // 1) Campo imagem (text simples)
  if (adRecord?.imagem && typeof adRecord.imagem === "string") {
    const url = adRecord.imagem.trim();
    if (url.length > 0) {
      images.push({
        id: `${adRecord.id}-main`,
        url,
      });
    }
  }

  // 2) Campo imagens (jsonb: array de URLs)
  const rawImagens = adRecord?.imagens;

  let imagensArray: unknown[] = [];

  if (Array.isArray(rawImagens)) {
    imagensArray = rawImagens;
  } else if (typeof rawImagens === "string") {
    // se por acaso o supabase devolver como string JSON
    try {
      const parsed = JSON.parse(rawImagens);
      if (Array.isArray(parsed)) {
        imagensArray = parsed;
      }
    } catch {
      // ignora JSON inválido
    }
  }

  imagensArray.forEach((value, index) => {
    if (typeof value !== "string") return;
    const url = value.trim();
    if (!url) return;

    // evita duplicar se for igual ao campo imagem
    const already = images.some((img) => img.url === url);
    if (already) return;

    images.push({
      id: `${adRecord.id}-arr-${index}`,
      url,
    });
  });

  return images;
}

export default function AdImageGallery({ adId }: { adId: number }) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const carregarImagens = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: adRecord, error: adError } = await supabase
          .from("anuncios")
          .select("*")
          .eq("id", adId)
          .maybeSingle();

        console.log("Registo do anúncio para imagens:", {
          adId,
          adRecord,
          adError,
        });

        if (adError) {
          console.error("Erro ao carregar anúncio para imagens:", adError);
          setError("Não foi possível carregar as imagens deste anúncio.");
          setLoading(false);
          return;
        }

        if (!adRecord) {
          setError("Anúncio não encontrado.");
          setLoading(false);
          return;
        }

        const imgs = extractImagesFromAdRecord(adRecord);

        setImages(imgs);
        setSelectedIndex(0);
      } catch (e) {
        console.error("Erro inesperado ao carregar imagens:", e);
        setError("Não foi possível carregar as imagens deste anúncio.");
      } finally {
        setLoading(false);
      }
    };

    if (adId) {
      void carregarImagens();
    }
  }, [adId]);

  if (loading) {
    return (
      <div style={mainImageBox}>
        <span style={placeholderText}>A carregar imagens…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={mainImageBox}>
        <span style={placeholderText}>{error}</span>
      </div>
    );
  }

  if (!images.length) {
    return (
      <div style={mainImageBox}>
        <span style={placeholderText}>
          Este anúncio ainda não tem imagens.
        </span>
      </div>
    );
  }

  const current = images[selectedIndex];

  return (
    <div style={galleryWrapper}>
      <div style={mainImageBox}>
        {current.url ? (
          <img
            src={current.url}
            alt="Imagem do anúncio"
            style={mainImgStyle}
          />
        ) : (
          <span style={placeholderText}>Imagem inválida.</span>
        )}
      </div>

      {images.length > 1 && (
        <div style={thumbsRow}>
          {images.map((img, index) => {
            const isActive = index === selectedIndex;

            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                style={{
                  ...thumbBoxBase,
                  borderColor: isActive ? "#10b981" : "transparent",
                }}
              >
                <img
                  src={img.url}
                  alt={`Imagem ${index + 1} do anúncio`}
                  style={thumbImgStyle}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
