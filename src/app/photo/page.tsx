import { pageSeo } from "@/lib/seo";
import PhotoExperience from "@/components/photo/PhotoExperience";

export const metadata = pageSeo("/photo");

export default function PhotoPage() {
  return (
    <main id="main">
      <PhotoExperience />
    </main>
  );
}
