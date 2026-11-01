import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";
import { PageFrame } from "@/components/shell/PageFrame";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function Admin() {
  return (
    <PageFrame tint="#e6b980" eyebrow="Only for me" title="Admin" lead="Write posts, sort photographs, add films and describe the drones. Press Publish and the site updates itself.">
      <AdminApp />
    </PageFrame>
  );
}
