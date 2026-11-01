import { pageSeo } from "@/lib/seo";
import FpvExperience from "@/components/fpv/FpvExperience";

export const metadata = pageSeo("/fpv");

export default function FpvPage() {
  return (
    <main id="main">
      <FpvExperience />
    </main>
  );
}
