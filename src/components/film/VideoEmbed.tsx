import { embedUrl } from "@/lib/video";

/** A YouTube or Vimeo video, in the same wide frame as the rest of the film pages. */
export default function VideoEmbed({ url, title }: { url: string; title: string }) {
  const src = embedUrl(url);
  if (!src) {
    return (
      <p className="border border-line p-6 text-bone/60">
        This video link was not recognised.{" "}
        <a href={url} className="text-[var(--tint)] underline underline-offset-4" rel="noopener noreferrer">
          Open it directly
        </a>
        .
      </p>
    );
  }
  return (
    <div className="relative w-full border border-line bg-coal" style={{ aspectRatio: "16 / 9" }}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
