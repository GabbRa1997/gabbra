import type { Metadata } from "next";
import FpvExperience from "@/components/fpv/FpvExperience";

export const metadata: Metadata = {
  title: "FPV",
  description: "Built for flight: an interactive exploded view of a five-inch FPV quad, and the way into the FPV work.",
};

export default function FpvPage() {
  return (
    <main id="main">
      <FpvExperience />
    </main>
  );
}
