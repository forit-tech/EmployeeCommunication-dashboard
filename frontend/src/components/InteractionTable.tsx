import { getInteractionKey, getInteractionLabel } from "../interactionTheme";
import type { InteractionRow } from "../types";

interface InteractionTableProps {
  interactions: InteractionRow[];
  isLoading: boolean;
  error: string | null;
}

function shortenUuid(value: string): string {
  return value.slice(0, 8);
}

export function InteractionTable({
  interactions,
  isLoading,
  error,
}: InteractionTableProps) {
  return (
    <section className="dashboard-panel table-panel">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Детализация</p>
          <h2>Таблица взаимодействий</h2>
        </div>
        <div className="section-meta">
          <span>{interactions.length} строк</span>
        </div>
      </div>

      {error ? (
        <div className="panel-state panel-state--error">{error}</div>
      ) : isLoading ? (
        <div className="panel-state">Загрузка строк взаимодействий...</div>
      ) : interactions.length === 0 ? (
        <div className="panel-state">Нет записей для выбранных фильтров.</div>
      ) : (
        <div className="table-wrap">
          <table className="interactions-table">
            <thead>
              <tr>
                <th>ID сотрудника 1</th>
                <th>ID сотрудника 2</th>
                <th>Тип</th>
                <th>Степень</th>
              </tr>
            </thead>
            <tbody>
              {interactions.map((row, index) => (
                <tr
                  key={`${row.employee_id_1}-${row.employee_id_2}-${row.interaction_type}-${index}`}
                >
                  <td title={row.employee_id_1}>
                    <code>{shortenUuid(row.employee_id_1)}</code>
                  </td>
                  <td title={row.employee_id_2}>
                    <code>{shortenUuid(row.employee_id_2)}</code>
                  </td>
                  <td>
                    <span className={`type-pill type-pill--${getInteractionKey(row.interaction_type)}`}>
                      {getInteractionLabel(row.interaction_type)}
                    </span>
                  </td>
                  <td>{row.interaction_strength}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
