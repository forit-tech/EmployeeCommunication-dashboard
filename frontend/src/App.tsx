import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { fetchHealth, fetchInteractions, fetchSummary } from "./api";
import { FiltersPanel } from "./components/FiltersPanel";
import { GraphView } from "./components/GraphView";
import { Header } from "./components/Header";
import { InteractionTable } from "./components/InteractionTable";
import { SummaryCards } from "./components/SummaryCards";
import type {
  DashboardFilters,
  GraphData,
  GraphLink,
  GraphNode,
  InteractionRow,
  SummaryData,
} from "./types";

type ThemeMode = "light" | "dark";

const DEFAULT_FILTERS: DashboardFilters = {
  interactionType: "",
  minStrength: 0,
  employeeId: "",
};
const THEME_STORAGE_KEY = "employee-dashboard-theme";

function normalizeEmployeeFilter(value: string): string {
  return value.trim().toLowerCase();
}

function matchesEmployeeFilter(employeeId: string, filterValue: string): boolean {
  if (!filterValue) {
    return true;
  }

  return employeeId.toLowerCase().startsWith(filterValue);
}

function filterInteractions(
  interactions: InteractionRow[],
  filters: DashboardFilters,
): InteractionRow[] {
  const minStrength = Number.isFinite(filters.minStrength)
    ? Number(filters.minStrength)
    : 0;
  const employeeFilter = normalizeEmployeeFilter(filters.employeeId);

  return interactions.filter((interaction) => {
    if (
      filters.interactionType &&
      interaction.interaction_type !== filters.interactionType
    ) {
      return false;
    }

    if (interaction.interaction_strength < minStrength) {
      return false;
    }

    if (
      employeeFilter &&
      !matchesEmployeeFilter(interaction.employee_id_1, employeeFilter) &&
      !matchesEmployeeFilter(interaction.employee_id_2, employeeFilter)
    ) {
      return false;
    }

    return true;
  });
}

function buildGraphData(interactions: InteractionRow[]): GraphData {
  if (interactions.length === 0) {
    return { nodes: [], links: [] };
  }

  const nodeMap = new Map<string, GraphNode>();
  const degreeMap = new Map<string, number>();

  const links: GraphLink[] = interactions.map((interaction) => {
    const sourceId = interaction.employee_id_1;
    const targetId = interaction.employee_id_2;

    if (!nodeMap.has(sourceId)) {
      nodeMap.set(sourceId, {
        id: sourceId,
        label: sourceId.slice(0, 8),
        degree: 0,
      });
    }

    if (!nodeMap.has(targetId)) {
      nodeMap.set(targetId, {
        id: targetId,
        label: targetId.slice(0, 8),
        degree: 0,
      });
    }

    degreeMap.set(sourceId, (degreeMap.get(sourceId) ?? 0) + 1);
    degreeMap.set(targetId, (degreeMap.get(targetId) ?? 0) + 1);

    return {
      source: sourceId,
      target: targetId,
      interaction_type: interaction.interaction_type,
      interaction_strength: interaction.interaction_strength,
    };
  });

  const nodes = Array.from(nodeMap.values())
    .map((node) => ({
      ...node,
      degree: degreeMap.get(node.id) ?? 0,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));

  return { nodes, links };
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  });
  const [apiStatus, setApiStatus] = useState<"loading" | "online" | "error">("loading");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [allInteractions, setAllInteractions] = useState<InteractionRow[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [interactionsError, setInteractionsError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isInteractionsLoading, setIsInteractionsLoading] = useState(true);

  const deferredEmployeeId = useDeferredValue(filters.employeeId);
  const normalizedFilters = useMemo(
    (): DashboardFilters => ({
      interactionType: filters.interactionType,
      minStrength: Number.isFinite(filters.minStrength)
        ? Number(filters.minStrength)
        : 0,
      employeeId: deferredEmployeeId,
    }),
    [deferredEmployeeId, filters.interactionType, filters.minStrength],
  );
  const filteredInteractions = useMemo(
    () => filterInteractions(allInteractions, normalizedFilters),
    [allInteractions, normalizedFilters],
  );
  const graphData = useMemo(
    () => buildGraphData(filteredInteractions),
    [filteredInteractions],
  );
  const graphError = interactionsError;
  const isGraphLoading = isInteractionsLoading;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();

    fetchHealth(controller.signal)
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("error"));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setIsSummaryLoading(true);
    setSummaryError(null);

    fetchSummary(controller.signal)
      .then((response) => {
        setSummary(response);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setSummaryError(error.message);
        }
      })
      .finally(() => {
        setIsSummaryLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setIsInteractionsLoading(true);
    setInteractionsError(null);

    fetchInteractions(DEFAULT_FILTERS, controller.signal)
      .then((response) => {
        setAllInteractions(response);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setInteractionsError(error.message);
        }
      })
      .finally(() => {
        setIsInteractionsLoading(false);
      });

    return () => controller.abort();
  }, []);

  function handleFilterChange<Key extends keyof DashboardFilters>(
    key: Key,
    value: DashboardFilters[Key],
  ) {
    setFilters((current) => ({
      ...current,
      [key]:
        key === "minStrength"
          ? Math.max(0, Number(value) || 0)
          : value,
    }));
  }

  function handleFilterReset() {
    setFilters(DEFAULT_FILTERS);
  }

  function handleThemeToggle() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return (
    <main className="app-shell">
      <Header
        apiStatus={apiStatus}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />

      {summaryError ? <div className="banner-error">{summaryError}</div> : null}

      <SummaryCards summary={summary} isLoading={isSummaryLoading} />

      <section className="dashboard-layout">
        <FiltersPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
        />

        <div className="dashboard-main">
          <GraphView
            data={graphData}
            error={graphError}
            isLoading={isGraphLoading}
            theme={theme}
          />
          <InteractionTable
            interactions={filteredInteractions}
            error={interactionsError}
            isLoading={isInteractionsLoading}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
