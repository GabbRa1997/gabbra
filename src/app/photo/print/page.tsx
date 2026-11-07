import type { Metadata } from "next";
import { Suspense } from "react";
import PrintStudio from "@/components/photo/PrintStudio";
import { PageFrame } from "@/components/shell/PageFrame";
import { PHOTO_PROJECTS } from "@/lib/media";

export const metadata: Metadata = { title: "Request a print", robots: { index: false, follow: false } };

export default function PrintPage() {
  const items = PHOTO_PROJECTS.flatMap((p) =>
    p.photos.map((photo) => ({ key: `${p.slug}/${photo.id}`, project: p.slug, projectTitle: p.title, photo })),
  );
  return (
    <PageFrame tint="#e6b980" eyebrow="01 / Photography — Print" title="Request a print">
      <Suspense fallback={null}>
        <PrintStudio items={items} />
      </Suspense>
    </PageFrame>
  );
}
