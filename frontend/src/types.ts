export interface HealthData {
  status: string;
}

export interface SummaryData {
  employees_count: number;
  interactions_count: number;
  average_strength: number;
  interaction_type_counts: Record<string, number>;
}

export interface InteractionRow {
  employee_id_1: string;
  employee_id_2: string;
  interaction_type: string;
  interaction_strength: number;
}

export interface DashboardFilters {
  interactionType: string;
  minStrength: number;
  employeeId: string;
}

export interface ApiGraphNode {
  id: string;
  label: string;
}

export interface GraphNode extends ApiGraphNode {
  degree: number;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  interaction_type: string;
  interaction_strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ApiGraphData {
  nodes: ApiGraphNode[];
  links: GraphLink[];
}
