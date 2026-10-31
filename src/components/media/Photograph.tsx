import type { CSSProperties } from "react";
import type { Photo } from "@/lib/media";

/**
 * A photograph with its own sizes already prepared: the browser chooses the
 * right file for the screen, and a blurred colour preview sits behind it
 * so the layout never jumps and the page never flashes empty.
 */
export default function Photograph({
  photo,
  sizes,
  priority = false,
  className = "",
  style,
  fit = "cover",
}: {
  photo: Photo;
  sizes: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  fit?: "cover" | "contain";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.srcset[Math.min(1, photo.srcset.length - 1)].url}
      srcSet={photo.srcset.map((s) => `${s.url} ${s.w}w`).join(", ")}
      sizes={sizes}
      width={photo.w}
      height={photo.h}
      alt={photo.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      className={`block h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
      style={{ backgroundColor: photo.color, backgroundImage: `url(${photo.blur})`, backgroundSize: "cover", ...style }}
    />
  );
}
