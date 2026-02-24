import Hero from "./components/Hero";
import CategoryPills from "./components/CategoryPills";
import HowItWorks from "./components/HowItWorks";
import VerificationBlock from "./components/VerificationBlock";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <main>
        <div style={{ fontSize: 11, textAlign: "center", padding: "6px 0", color: "#64748b" }}>
          build-marker: tuej-v2-2026-02-24-01
        </div>
        <Hero />
        <CategoryPills />
        <HowItWorks />
        <VerificationBlock />
      </main>
    </>
  );
}
