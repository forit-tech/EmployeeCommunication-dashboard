const interactionAliases: Record<string, "task" | "call" | "message"> = {
  task: "task",
  "задача": "task",
  call: "call",
  "звонок": "call",
  message: "message",
  "сообщение": "message",
};

export function getInteractionKey(value: string): "task" | "call" | "message" | "default" {
  return interactionAliases[value.trim().toLowerCase()] ?? "default";
}

export function getInteractionColor(value: string): string {
  const key = getInteractionKey(value);
  if (key === "task") {
    return "#4f7cff";
  }
  if (key === "call") {
    return "#f59e0b";
  }
  if (key === "message") {
    return "#14b8a6";
  }
  return "#7b8ca4";
}

export function getInteractionLabel(value: string): string {
  const key = getInteractionKey(value);
  if (key === "task") {
    return "Задача";
  }
  if (key === "call") {
    return "Звонок";
  }
  if (key === "message") {
    return "Сообщение";
  }
  return value;
}
