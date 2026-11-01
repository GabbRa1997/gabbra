import { pageSeo } from "@/lib/seo";
import FilmHub from "@/components/film/FilmHub";

export const metadata = pageSeo("/film");

export default function FilmPage() {
  return (
    <main id="main">
      <FilmHub />
    </main>
  );
}
