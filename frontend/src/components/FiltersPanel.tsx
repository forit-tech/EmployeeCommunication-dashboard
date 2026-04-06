import type { DashboardFilters } from "../types";

interface FiltersPanelProps {
  filters: DashboardFilters;
  onChange: <Key extends keyof DashboardFilters>(
    key: Key,
    value: DashboardFilters[Key],
  ) => void;
  onReset: () => void;
}

const interactionTypes = [
  { label: "Все типы", value: "" },
  { label: "Задача", value: "задача" },
  { label: "Звонок", value: "звонок" },
  { label: "Сообщение", value: "сообщение" },
];

export function FiltersPanel({
  filters,
  onChange,
  onReset,
}: FiltersPanelProps) {
  return (
    <aside className="dashboard-panel filters-panel">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Контролы</p>
          <h2>Фильтры</h2>
        </div>
        <button className="ghost-button" type="button" onClick={onReset}>
          Сбросить
        </button>
      </div>

      <label className="field">
        <span className="field-label">Тип взаимодействия</span>
        <select
          className="field-input"
          value={filters.interactionType}
          onChange={(event) => onChange("interactionType", event.target.value)}
        >
          {interactionTypes.map((type) => (
            <option key={type.label} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Минимальная степень обмена</span>
        <div className="range-row">
          <input
            className="range-input"
            type="range"
            min="0"
            max="100"
            value={filters.minStrength}
            onChange={(event) =>
              onChange("minStrength", Number(event.target.value))
            }
          />
          <span className="range-value">{filters.minStrength}</span>
        </div>
      </label>

      <label className="field">
        <span className="field-label">Employee ID / префикс UUID</span>
        <input
          className="field-input field-input--mono"
          type="text"
          placeholder="Полный UUID или начало UUID, например 396b1400"
          value={filters.employeeId}
          onChange={(event) => onChange("employeeId", event.target.value)}
        />
      </label>

      <div className="filter-note">
        Фильтры пересчитывают граф и таблицу из одного набора связей без перезагрузки страницы.
      </div>
    </aside>
  );
}
