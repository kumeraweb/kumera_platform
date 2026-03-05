import LeadosNavClient from "./nav-client";

export default function LeadosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-5">
      <LeadosNavClient />
      {children}
    </div>
  );
}
