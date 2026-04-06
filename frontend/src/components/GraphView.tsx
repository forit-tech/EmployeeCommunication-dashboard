import { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

import {
  getInteractionColor,
  getInteractionKey,
  getInteractionLabel,
} from "../interactionTheme";
import type { GraphData, GraphLink, GraphNode } from "../types";

interface GraphViewProps {
  data: GraphData;
  isLoading: boolean;
  error: string | null;
  theme: "light" | "dark";
}

const interactionCurvature: Record<string, number> = {
  task: 0,
  call: 0.08,
  message: -0.08,
  default: 0,
};

const FALLBACK_GRAPH_WIDTH = 938;
const FALLBACK_GRAPH_HEIGHT = 600;

function getNodeId(node: string | GraphNode): string {
  return typeof node === "string" ? node : node.id;
}

function getLinkKey(link: GraphLink): string {
  return `${getNodeId(link.source)}-${getNodeId(link.target)}-${link.interaction_type}-${link.interaction_strength}`;
}

function getLinkWidth(strength: number): number {
  return Math.max(0.8, Math.min(4.8, 0.8 + strength / 22));
}

export function GraphView({ data, isLoading, error, theme }: GraphViewProps) {
  const graphRef = useRef<any>();
  const graphContainerRef = useRef<HTMLDivElement | null>(null);
  const initialFitDoneRef = useRef(false);
  const fitTimeoutRef = useRef<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const safeNodes = Array.isArray(data.nodes) ? data.nodes : [];
  const safeLinks = Array.isArray(data.links) ? data.links : [];
  const graphWidth =
    size.width > 0
      ? size.width
      : graphContainerRef.current?.clientWidth && graphContainerRef.current.clientWidth > 0
        ? Math.floor(graphContainerRef.current.clientWidth)
        : FALLBACK_GRAPH_WIDTH;
  const graphHeight =
    size.height > 0
      ? size.height
      : graphContainerRef.current?.clientHeight && graphContainerRef.current.clientHeight > 0
        ? Math.floor(graphContainerRef.current.clientHeight)
        : FALLBACK_GRAPH_HEIGHT;

  const fitGraphToView = useCallback((): boolean => {
    const graph = graphRef.current;
    if (!graph) {
      return false;
    }

    if (safeNodes.length === 0 || safeLinks.length === 0) {
      return false;
    }

    if (!graphWidth || !graphHeight) {
      return false;
    }

    if (fitTimeoutRef.current) {
      window.clearTimeout(fitTimeoutRef.current);
    }

    window.requestAnimationFrame(() => {
      fitTimeoutRef.current = window.setTimeout(() => {
        try {
          graph.zoomToFit(600, 80);
        } catch (error) {
          console.error("zoomToFit failed", error);
        }
      }, 250);
    });

    return true;
  }, [graphHeight, graphWidth, safeLinks.length, safeNodes.length]);

  const handleResetView = useCallback(() => {
    fitGraphToView();
  }, [fitGraphToView]);

  const neighboringNodes = new Map<string, Set<string>>();
  for (const node of safeNodes) {
    neighboringNodes.set(node.id, new Set<string>());
  }

  for (const link of safeLinks) {
    const sourceId = getNodeId(link.source);
    const targetId = getNodeId(link.target);
    neighboringNodes.get(sourceId)?.add(targetId);
    neighboringNodes.get(targetId)?.add(sourceId);
  }

  const highlightedNodeIds = new Set<string>();
  const highlightedLinkKeys = new Set<string>();
  if (selectedNodeId) {
    highlightedNodeIds.add(selectedNodeId);
    for (const neighborId of neighboringNodes.get(selectedNodeId) ?? []) {
      highlightedNodeIds.add(neighborId);
    }

    for (const link of safeLinks) {
      const sourceId = getNodeId(link.source);
      const targetId = getNodeId(link.target);
      if (sourceId === selectedNodeId || targetId === selectedNodeId) {
        highlightedLinkKeys.add(getLinkKey(link));
      }
    }
  }

  const selectedNode = safeNodes.find((node) => node.id === selectedNodeId) ?? null;

  useEffect(() => {
    if (selectedNodeId && !safeNodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [safeNodes, selectedNodeId]);

  useEffect(() => {
    if (!graphContainerRef.current) {
      return;
    }

    const element = graphContainerRef.current;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const nextWidth = Math.floor(rect.width);
      const nextHeight = Math.floor(rect.height);

      if (nextWidth <= 0 || nextHeight <= 0) {
        return;
      }

      setSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) {
          return current;
        }

        return {
          width: nextWidth,
          height: nextHeight,
        };
      });
    };

    updateSize();
    window.requestAnimationFrame(updateSize);

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (initialFitDoneRef.current) {
      return;
    }

    if (safeNodes.length === 0 || safeLinks.length === 0) {
      return;
    }

    if (!graphWidth || !graphHeight) {
      return;
    }

    if (!fitGraphToView()) {
      return;
    }

    initialFitDoneRef.current = true;
  }, [fitGraphToView, graphHeight, graphWidth, safeLinks.length, safeNodes.length]);

  useEffect(
    () => () => {
      if (fitTimeoutRef.current) {
        window.clearTimeout(fitTimeoutRef.current);
      }
    },
    [],
  );

  const shouldShowAllLabels = safeNodes.length <= 24;

  return (
    <section className="dashboard-panel graph-panel">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Основная визуализация</p>
          <h2>Граф связей между сотрудниками</h2>
        </div>
        <div className="section-actions">
          <div className="section-meta">
            <span>{safeNodes.length} узлов</span>
            <span>{safeLinks.length} связей</span>
          </div>
          <button
            className="ghost-button"
            type="button"
            onClick={handleResetView}
          >
            Сбросить вид
          </button>
        </div>
      </div>

      <div className="graph-legend" aria-label="Легенда графа">
        {["задача", "звонок", "сообщение"].map((type) => (
          <span key={type} className="legend-chip">
            <span className="legend-dot" style={{ backgroundColor: getInteractionColor(type) }} />
            {getInteractionLabel(type)}
          </span>
        ))}
      </div>

      {error ? (
        <div className="panel-state panel-state--error">{error}</div>
      ) : isLoading ? (
        <div className="panel-state">Загрузка графа...</div>
      ) : safeNodes.length === 0 || safeLinks.length === 0 ? (
        <div className="panel-state">Нет связей для выбранных фильтров.</div>
      ) : (
        <div className="graph-layout">
          <div ref={graphContainerRef} className="graph-canvas-wrap">
            <ForceGraph2D
              ref={graphRef}
              width={graphWidth}
              height={graphHeight}
              backgroundColor="rgba(255,255,255,0)"
              graphData={{ nodes: safeNodes, links: safeLinks }}
              cooldownTicks={80}
              linkColor={(link) => {
                const typedLink = link as GraphLink;
                const baseColor = getInteractionColor(typedLink.interaction_type);
                if (selectedNodeId && !highlightedLinkKeys.has(getLinkKey(typedLink))) {
                  return `${baseColor}26`;
                }
                return baseColor;
              }}
              linkCurvature={(link) => {
                const typedLink = link as GraphLink;
                return interactionCurvature[getInteractionKey(typedLink.interaction_type)] ?? 0;
              }}
              linkDirectionalParticles={(link) => {
                const typedLink = link as GraphLink;
                return highlightedLinkKeys.has(getLinkKey(typedLink)) ? 2 : 0;
              }}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleColor={(link) =>
                getInteractionColor((link as GraphLink).interaction_type)
              }
              linkWidth={(link) => {
                const typedLink = link as GraphLink;
                const width = getLinkWidth(typedLink.interaction_strength);
                if (selectedNodeId && !highlightedLinkKeys.has(getLinkKey(typedLink))) {
                  return Math.max(0.6, width * 0.35);
                }
                return width;
              }}
              nodeCanvasObject={(node, context, globalScale) => {
                const typedNode = node as GraphNode;
                const isActive = highlightedNodeIds.has(typedNode.id);
                const isSelected = typedNode.id === selectedNodeId;
                const radius = isSelected ? 7 : isActive ? 5.8 : safeNodes.length > 70 ? 3.6 : 4.6;
                const fontSize = Math.max(3.4, (isSelected ? 15 : 11) / globalScale);
                const labelY = radius + 10 / globalScale;
                const fillColor =
                  theme === "dark"
                    ? isSelected
                      ? "#f8fafc"
                      : isActive
                        ? "#c7d2fe"
                        : "#7c93b6"
                    : isSelected
                      ? "#10233d"
                      : isActive
                        ? "#234767"
                        : "#41637f";

                context.beginPath();
                context.arc(typedNode.x ?? 0, typedNode.y ?? 0, radius, 0, 2 * Math.PI, false);
                context.fillStyle = fillColor;
                context.fill();

                context.beginPath();
                context.arc(
                  typedNode.x ?? 0,
                  typedNode.y ?? 0,
                  radius + 1.8,
                  0,
                  2 * Math.PI,
                  false,
                );
                context.strokeStyle = isSelected ? "#f8fafc" : "rgba(248,250,252,0.8)";
                if (theme === "dark") {
                  context.strokeStyle = isSelected ? "#0f172a" : "rgba(15,23,42,0.75)";
                }
                context.lineWidth = 1.2 / globalScale;
                context.stroke();

                if (!shouldShowAllLabels && !isActive && !isSelected) {
                  return;
                }

                context.font = `600 ${fontSize}px Inter, sans-serif`;
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillStyle = theme === "dark" ? "#e2e8f0" : "#10233d";
                context.fillText(
                  typedNode.label,
                  typedNode.x ?? 0,
                  (typedNode.y ?? 0) + labelY,
                );
              }}
              nodeLabel={(node) => {
                const typedNode = node as GraphNode;
                return `<div><strong>${typedNode.label}</strong><br/>${typedNode.id}</div>`;
              }}
              nodeVal={(node) => {
                const typedNode = node as GraphNode;
                return Math.max(2, typedNode.degree);
              }}
              onBackgroundClick={() => setSelectedNodeId(null)}
              onNodeClick={(node) => {
                const typedNode = node as GraphNode;
                setSelectedNodeId((current) =>
                  current === typedNode.id ? null : typedNode.id,
                );
              }}
            />
          </div>

          <aside className="graph-detail">
            <p className="graph-detail-label">Деталь узла</p>
            {selectedNode ? (
              <>
                <strong className="graph-detail-title">{selectedNode.label}</strong>
                <code className="graph-detail-code">{selectedNode.id}</code>
                <div className="graph-detail-stats">
                  <span>
                    <strong>{selectedNode.degree}</strong>
                    Связанные ребра
                  </span>
                  <span>
                    <strong>
                      {(neighboringNodes.get(selectedNode.id)?.size ?? 0).toString()}
                    </strong>
                    Соседние узлы
                  </span>
                </div>
              </>
            ) : (
              <p className="graph-detail-empty">
                Кликните по узлу, чтобы увидеть полный UUID и подсветить
                локальные связи.
              </p>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
