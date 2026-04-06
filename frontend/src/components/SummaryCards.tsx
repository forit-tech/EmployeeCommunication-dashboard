import { getInteractionLabel } from "../interactionTheme";
import type { SummaryData } from "../types";

interface SummaryCardsProps {
  summary: SummaryData | null;
  isLoading: boolean;
}

function formatValue(value: number | undefined, digits = 0): string {
  if (value === undefined) {
    return "—";
  }

  return value.toLocaleString("ru-RU", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function getDominantInteractionType(summary: SummaryData | null): string {
  if (!summary) {
    return "—";
  }

  const dominant = Object.entries(summary.interaction_type_counts).sort(
    (left, right) => right[1] - left[1],
  )[0];

  if (!dominant) {
    return "—";
  }

  return `${getInteractionLabel(dominant[0])} (${dominant[1]})`;
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  const cards = [
    {
      label: "Сотрудники",
      value: summary ? formatValue(summary.employees_count) : "—",
      tone: "blue",
    },
    {
      label: "Взаимодействия",
      value: summary ? formatValue(summary.interactions_count) : "—",
      tone: "teal",
    },
    {
      label: "Средняя степень обмена",
      value: summary ? formatValue(summary.average_strength, 2) : "—",
      tone: "amber",
    },
    {
      label: "Доминирующий тип",
      value: getDominantInteractionType(summary),
      tone: "slate",
    },
  ];

  return (
    <section className="stats-grid" aria-label="Сводные метрики">
      {cards.map((card) => (
        <article key={card.label} className={`stat-card stat-card--${card.tone}`}>
          <span className="stat-label">{card.label}</span>
          <strong className={`stat-value ${isLoading ? "is-loading" : ""}`}>
            {card.value}
          </strong>
        </article>
      ))}
    </section>
  );
}
