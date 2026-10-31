import type { Metadata } from "next";
import PhotoExperience from "@/components/photo/PhotoExperience";

export const metadata: Metadata = {
  title: "Photography",
  description: "Open the camera: an interactive exploded view of a Canon EOS 550D, and the way into the photography.",
};

export default function PhotoPage() {
  return (
    <main id="main">
      <PhotoExperience />
    </main>
  );
}
