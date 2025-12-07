"use client";

import { useState, useEffect } from "react";
import type { CSSProperties, MouseEvent } from "react";

type Props = {
  images: string[];
  title?: string;
};

const placeholderBox: CSSProperties = {
  width: "100%",
  borderRadius: 12,
  overflow: "hidden",
  backgroundColor: "#e5e7eb",
  minHeight: 260,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const placeholderText: CSSProperties = {
  color: "#9ca3af",
  fontSize: 13,
};

const galleryGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 10,
};

const galleryItem: CSSProperties = {
  position: "relative",
  borderRadius: 12,
  overflow: "hidden",
  backgroundColor: "#e5e7eb",
  aspectRatio: "4 / 3",
  cursor: "pointer",
};

const galleryImg: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transition: "transform 0.2s ease-out",
};

const galleryBadge: CSSProperties = {
  position: "absolute",
  top: 6,
  left: 6,
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
  backgroundColor: "rgba(15,23,42,0.85)",
  color: "#ffffff",
};

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15,23,42,0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 40,
};

const lightboxContent: CSSProperties = {
  position: "relative",
  maxWidth: "900px",
  width: "90%",
  maxHeight: "80vh",
  backgroundColor: "#0f172a",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
  display: "flex",
  flexDirection: "column",
};

const lightboxImgWrapper: CSSProperties = {
  flex: 1,
  borderRadius: 12,
  overflow: "hidden",
  backgroundColor: "#020617",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const lightboxImg: CSSProperties = {
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
};

const closeButton: CSSProperties = {
  position: "absolute",
  top: 10,
  right: 10,
  width: 32,
  height: 32,
  borderRadius: 999,
  border: "none",
  backgroundColor: "rgba(15,23,42,0.85)",
  color: "#e5e7eb",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
};

const navButtonBase: CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 40,
  height: 40,
  borderRadius: 999,
  border: "none",
  backgroundColor: "rgba(15,23,42,0.85)",
  color: "#e5e7eb",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
};

const navButtonLeft: CSSProperties = {
  ...navButtonBase,
  left: 10,
};

const navButtonRight: CSSProperties = {
  ...navButtonBase,
  right: 10,
};

const lightboxFooter: CSSProperties = {
  marginTop: 8,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "#e5e7eb",
  fontSize: 13,
};

export function AdImageGallery({ images, title }: Props) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const hasImages = images && images.length > 0;

  const openAt = (index: number) => {
    if (!hasImages) return;
    setCurrentIndex(index);
  };

  const close = () => setCurrentIndex(null);

  const goNext = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (!hasImages || currentIndex === null) return;
    setCurrentIndex((prev) =>
      prev === null ? 0 : (prev + 1) % images.length
    );
  };

  const goPrev = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (!hasImages || currentIndex === null) return;
    setCurrentIndex((prev) =>
      prev === null ? 0 : (prev - 1 + images.length) % images.length
    );
  };

  useEffect(() => {
    if (currentIndex === null) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, images.length]);

  if (!hasImages) {
    return (
      <div style={placeholderBox}>
        <span style={placeholderText}>
          Este anúncio ainda não tem imagens.
        </span>
      </div>
    );
  }

  return (
    <>
      <div style={galleryGrid}>
        {images.map((src, index) => (
          <button
            key={src + index}
            type="button"
            style={galleryItem}
            onClick={() => openAt(index)}
          >
            {index === 0 && <span style={galleryBadge}>Principal</span>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" style={galleryImg} />
          </button>
        ))}
      </div>

      {currentIndex !== null && (
        <div style={overlay} onClick={close}>
          <div
            style={lightboxContent}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              style={closeButton}
              onClick={close}
              aria-label="Fechar"
            >
              ×
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  style={navButtonLeft}
                  onClick={goPrev}
                  aria-label="Imagem anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  style={navButtonRight}
                  onClick={goNext}
                  aria-label="Próxima imagem"
                >
                  ›
                </button>
              </>
            )}

            <div style={lightboxImgWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[currentIndex]}
                alt={title || "Imagem do anúncio"}
                style={lightboxImg}
              />
            </div>

            <div style={lightboxFooter}>
              <span>{title}</span>
              <span>
                Imagem {currentIndex + 1} de {images.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
