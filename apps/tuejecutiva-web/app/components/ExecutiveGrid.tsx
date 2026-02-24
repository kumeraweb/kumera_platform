import ExecutiveCard, { Executive } from "./ExecutiveCard";

interface ExecutiveGridProps {
  executives: Executive[];
}

export default function ExecutiveGrid({ executives }: ExecutiveGridProps) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {executives.map((executive, index) => (
        <ExecutiveCard
          key={executive.id ? executive.id : `executive-${index}`}
          executive={executive}
        />
      ))}
    </div>
  );
}
