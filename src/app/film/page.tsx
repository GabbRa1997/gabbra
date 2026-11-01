import type { Metadata } from "next";
import FilmHub from "@/components/film/FilmHub";

export const metadata: Metadata = {
  title: "Film",
  description: "Frames, in sequence: short films, commercial and creative work, and collaborations.",
};

export default function FilmPage() {
  return (
    <main id="main">
      <FilmHub />
    </main>
  );
}
