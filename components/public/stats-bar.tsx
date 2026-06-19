interface StatsBarProps {
  total: number;
  resolved: number;
  inProgress: number;
}

export function StatsBar({ total, resolved, inProgress }: StatsBarProps) {
  const stats = [
    { value: total.toLocaleString(), label: "Total Reports" },
    { value: "15", label: "Counties Covered" },
    { value: resolved.toLocaleString(), label: "Issues Resolved" },
    { value: inProgress.toLocaleString(), label: "Under Review" },
  ];

  return (
    <section className="border-b border-border bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white px-4 py-8 text-center md:px-6">
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-[var(--nrf-blue)] md:text-4xl">
              {stat.value}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
