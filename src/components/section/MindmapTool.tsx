'use client';

import { Section } from '@components/layout';
import { MindmapToolStyles } from '@styles/section';
import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type SideView = 'mindmaps' | 'outline';
type TerminalSide = 'top' | 'right' | 'bottom' | 'left';
type NodeKind =
  | 'node'
  | 'sticky'
  | 'group'
  | 'decision'
  | 'checklist'
  | 'tag'
  | 'reference'
  | 'comment'
  | 'media'
  | 'code'
  | 'metric'
  | 'milestone'
  | 'swimlane'
  | 'portal'
  | 'legend'
  | 'ai-summary';

interface TemplateEntry {
  title: string;
  description: string;
  code: string;
  board: {
    nodes: MindmapNode[];
    edges: MindmapEdge[];
  };
}

interface MindmapNode {
  id: string;
  title: string;
  x: number;
  y: number;
  kind?: NodeKind;
  content?: string;
}

interface MindmapEdge {
  id: string;
  from: string;
  to: string;
  fromTerminal: TerminalSide;
  toTerminal: TerminalSide;
}

interface MindmapNote {
  id: string;
  title: string;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  updatedAt: number;
}

const terminalSides: TerminalSide[] = ['top', 'right', 'bottom', 'left'];

const nodeKindOptions: Array<{ kind: NodeKind; label: string; icon: string }> =
  [
    { kind: 'node', label: 'Node', icon: '◯' },
    { kind: 'sticky', label: 'Sticky Note', icon: '🗒' },
    { kind: 'group', label: 'Group / Container', icon: '▦' },
    { kind: 'decision', label: 'Decision', icon: '◇' },
    { kind: 'checklist', label: 'Checklist', icon: '☑' },
    { kind: 'tag', label: 'Tag', icon: '#' },
    { kind: 'reference', label: 'Reference', icon: '↗' },
    { kind: 'comment', label: 'Comment', icon: '💬' },
    { kind: 'media', label: 'Media', icon: '🖼' },
    { kind: 'code', label: 'Code / JSON', icon: '{}' },
    { kind: 'metric', label: 'Metric', icon: '📈' },
    { kind: 'milestone', label: 'Timeline / Milestone', icon: '⏱' },
    { kind: 'swimlane', label: 'Swimlane Header', icon: '≡' },
    { kind: 'portal', label: 'Portal', icon: '◎' },
    { kind: 'legend', label: 'Legend', icon: 'ℹ' },
    { kind: 'ai-summary', label: 'AI Summary', icon: '✦' },
  ];

const NODE_WIDTH = 220;
const NODE_HEIGHT = 64;
const BOARD_WIDTH = 2600;
const BOARD_HEIGHT = 1800;
const BOARD_OFFSET_X = 760;
const BOARD_OFFSET_Y = 430;
const EDGE_SNAP_DISTANCE = 18;
const EDGE_SNAP_PADDING = 16;

const clampToRange = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const templateEntries: TemplateEntry[] = [
  {
    title: 'Launch Board',
    description: 'Presentation-ready product launch command center.',
    code: `mindmap
  root((Product Launch Board))
    Strategy
      Positioning
        Messaging Pillars
        Value Narrative
      Goals
        Revenue Target
        Activation KPI
        Retention KPI
    Product
      Core Release
        Product Node
        QA Signoff
      Roadmap
        NYC Rollout
        EMEA Rollout
        APAC Rollout
    Growth
      Campaigns
        Launch PPC Campaign
        Build A/B Landing Test
        Influencer Wave
      SEO
        Topic Cluster
        Comparison Pages
    Creative Studio
      Brand System
      Motion Teasers
      Demo Clips
    Sales Enablement
      Decks
      Battlecards
      Objection Handling
    Operations
      Release Runbook
      Incident Plan
      Support Readiness
    Collaboration
      Executive Review
      Stakeholder Comments
      Weekly Sync
    Metrics
      Pipeline Coverage
      CAC Payback
      Win Rate`,
    board: {
      nodes: [
        { id: 'root', title: 'Product Launch Board', x: 430, y: 300 },
        { id: 'strategy', title: 'Strategy', x: 150, y: 130 },
        { id: 'product', title: 'Product', x: 150, y: 280 },
        { id: 'growth', title: 'Growth', x: 150, y: 430 },
        { id: 'creative', title: 'Creative Studio', x: 710, y: 130 },
        { id: 'sales', title: 'Sales Enablement', x: 710, y: 280 },
        { id: 'ops', title: 'Operations', x: 710, y: 430 },
        { id: 'metrics', title: 'Metrics', x: 430, y: 490 },
      ],
      edges: [
        {
          id: 'e-root-strategy',
          from: 'root',
          to: 'strategy',
          fromTerminal: 'left',
          toTerminal: 'right',
        },
        {
          id: 'e-root-product',
          from: 'root',
          to: 'product',
          fromTerminal: 'left',
          toTerminal: 'right',
        },
        {
          id: 'e-root-growth',
          from: 'root',
          to: 'growth',
          fromTerminal: 'left',
          toTerminal: 'right',
        },
        {
          id: 'e-root-creative',
          from: 'root',
          to: 'creative',
          fromTerminal: 'right',
          toTerminal: 'left',
        },
        {
          id: 'e-root-sales',
          from: 'root',
          to: 'sales',
          fromTerminal: 'right',
          toTerminal: 'left',
        },
        {
          id: 'e-root-ops',
          from: 'root',
          to: 'ops',
          fromTerminal: 'right',
          toTerminal: 'left',
        },
        {
          id: 'e-root-metrics',
          from: 'root',
          to: 'metrics',
          fromTerminal: 'bottom',
          toTerminal: 'top',
        },
      ],
    },
  },
  {
    title: 'Innovation Map',
    description: 'Clean executive map for roadmap storytelling.',
    code: `mindmap
  root((Innovation Portfolio))
    Horizon 1
      Stabilize Core
      Improve Adoption
      Reduce Churn
    Horizon 2
      Workflow Automation
      AI Assistants
      Ecosystem Integrations
    Horizon 3
      New Market Bet
      Strategic Partnerships
      Platform Expansion
    Foundations
      Security
      Data Platform
      Developer Experience
    Governance
      Risk Review
      Compliance Gates
      Budget Cadence`,
    board: {
      nodes: [
        { id: 'root', title: 'Innovation Portfolio', x: 430, y: 300 },
        { id: 'h1', title: 'Horizon 1', x: 150, y: 150 },
        { id: 'h2', title: 'Horizon 2', x: 150, y: 300 },
        { id: 'h3', title: 'Horizon 3', x: 150, y: 450 },
        { id: 'foundations', title: 'Foundations', x: 710, y: 220 },
        { id: 'governance', title: 'Governance', x: 710, y: 380 },
      ],
      edges: [
        {
          id: 'e-root-h1',
          from: 'root',
          to: 'h1',
          fromTerminal: 'left',
          toTerminal: 'right',
        },
        {
          id: 'e-root-h2',
          from: 'root',
          to: 'h2',
          fromTerminal: 'left',
          toTerminal: 'right',
        },
        {
          id: 'e-root-h3',
          from: 'root',
          to: 'h3',
          fromTerminal: 'left',
          toTerminal: 'right',
        },
        {
          id: 'e-root-foundations',
          from: 'root',
          to: 'foundations',
          fromTerminal: 'right',
          toTerminal: 'left',
        },
        {
          id: 'e-root-governance',
          from: 'root',
          to: 'governance',
          fromTerminal: 'right',
          toTerminal: 'left',
        },
      ],
    },
  },
];

const STORAGE_CODE_KEY = 'tool-mindmap-code';
const STORAGE_SIDE_KEY = 'tool-mindmap-side';
const STORAGE_ZOOM_KEY = 'tool-mindmap-zoom';
const STORAGE_NOTES_KEY = 'tool-mindmap-notes';
const STORAGE_SELECTED_NOTE_KEY = 'tool-mindmap-selected-note';

const readInitialSide = (): SideView => {
  if (typeof window === 'undefined') return 'mindmaps';
  return localStorage.getItem(STORAGE_SIDE_KEY) === 'outline'
    ? 'outline'
    : 'mindmaps';
};

const readInitialZoom = (): number => {
  if (typeof window === 'undefined') return 100;
  const raw = Number(localStorage.getItem(STORAGE_ZOOM_KEY) || '100');
  if (!Number.isFinite(raw)) return 100;
  return Math.min(180, Math.max(50, raw));
};

const cloneBoard = (board: { nodes: MindmapNode[]; edges: MindmapEdge[] }) => ({
  nodes: board.nodes.map((node) => ({ ...node })),
  edges: board.edges.map((edge) => ({ ...edge })),
});

const cloneNodes = (nodes: MindmapNode[]) =>
  nodes.map((node) => ({
    ...node,
    kind: node.kind || 'node',
    content: node.content || '',
  }));

const cloneEdges = (edges: MindmapEdge[]) => edges.map((edge) => ({ ...edge }));

const normalizeBoard = (board: {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
}) => ({
  nodes: board.nodes.map((node) => ({
    ...node,
    x: node.x + BOARD_OFFSET_X,
    y: node.y + BOARD_OFFSET_Y,
  })),
  edges: board.edges.map((edge) => ({ ...edge })),
});

const defaultMindmapBoard = () => {
  const first = templateEntries[0];
  return normalizeBoard(cloneBoard(first.board));
};

const getDefaultTitleForKind = (kind: NodeKind, index: number) => {
  if (kind === 'sticky') return `Note ${index}`;
  if (kind === 'group') return `Group ${index}`;
  if (kind === 'decision') return `Decision ${index}`;
  if (kind === 'checklist') return `Checklist ${index}`;
  if (kind === 'tag') return `Tag ${index}`;
  if (kind === 'reference') return `Reference ${index}`;
  if (kind === 'comment') return `Comment ${index}`;
  if (kind === 'media') return `Media ${index}`;
  if (kind === 'code') return `Code ${index}`;
  if (kind === 'metric') return `Metric ${index}`;
  if (kind === 'milestone') return `Milestone ${index}`;
  if (kind === 'swimlane') return `Lane ${index}`;
  if (kind === 'portal') return `Portal ${index}`;
  if (kind === 'legend') return `Legend ${index}`;
  if (kind === 'ai-summary') return `AI Summary ${index}`;
  return `Node ${index}`;
};

const getDefaultContentForKind = (kind: NodeKind) => {
  if (kind === 'sticky') return 'Add note details here.';
  if (kind === 'group') return 'Scope and boundary notes.';
  if (kind === 'decision') return 'Option A vs Option B';
  if (kind === 'checklist') return '- Item 1\n- Item 2';
  if (kind === 'tag') return '#priority';
  if (kind === 'reference') return 'https://example.com/resource';
  if (kind === 'comment') return 'Thread comment...';
  if (kind === 'media') return 'Image URL or attachment name';
  if (kind === 'code') return 'const value = 1;';
  if (kind === 'metric') return 'KPI: 0\nTrend: ↗';
  if (kind === 'milestone') return 'YYYY-MM-DD';
  if (kind === 'swimlane') return 'Owner: Team';
  if (kind === 'portal') return 'Target board: /mindmap/...';
  if (kind === 'legend') return 'Blue = high priority';
  if (kind === 'ai-summary') return 'Auto-generated summary.';
  return '';
};

const getContentPlaceholderForKind = (kind: NodeKind) => {
  if (kind === 'sticky') return 'Write your note content';
  if (kind === 'group') return 'Group description';
  if (kind === 'decision') return 'Decision options';
  if (kind === 'checklist') return 'One checklist item per line';
  if (kind === 'tag') return '#tag values';
  if (kind === 'reference') return 'Reference URL or source';
  if (kind === 'comment') return 'Comment text';
  if (kind === 'media') return 'Media source / caption';
  if (kind === 'code') return 'Code or JSON snippet';
  if (kind === 'metric') return 'Metric and trend';
  if (kind === 'milestone') return 'Date and milestone detail';
  if (kind === 'swimlane') return 'Team / owner';
  if (kind === 'portal') return 'Target board link';
  if (kind === 'legend') return 'Legend details';
  if (kind === 'ai-summary') return 'Summary details';
  return 'Additional content';
};

const getNodeKindMeta = (kind: NodeKind) => {
  if (kind === 'sticky')
    return { label: 'Sticky', className: 'NodeKindSticky' };
  if (kind === 'group') return { label: 'Group', className: 'NodeKindGroup' };
  if (kind === 'decision')
    return { label: 'Decision', className: 'NodeKindDecision' };
  if (kind === 'checklist')
    return { label: 'Checklist', className: 'NodeKindChecklist' };
  if (kind === 'tag') return { label: 'Tag', className: 'NodeKindTag' };
  if (kind === 'reference')
    return { label: 'Reference', className: 'NodeKindReference' };
  if (kind === 'comment')
    return { label: 'Comment', className: 'NodeKindComment' };
  if (kind === 'media') return { label: 'Media', className: 'NodeKindMedia' };
  if (kind === 'code') return { label: 'Code', className: 'NodeKindCode' };
  if (kind === 'metric')
    return { label: 'Metric', className: 'NodeKindMetric' };
  if (kind === 'milestone')
    return { label: 'Milestone', className: 'NodeKindMilestone' };
  if (kind === 'swimlane')
    return { label: 'Swimlane', className: 'NodeKindSwimlane' };
  if (kind === 'portal')
    return { label: 'Portal', className: 'NodeKindPortal' };
  if (kind === 'legend')
    return { label: 'Legend', className: 'NodeKindLegend' };
  if (kind === 'ai-summary')
    return { label: 'AI Summary', className: 'NodeKindAiSummary' };
  return { label: 'Node', className: 'NodeKindNode' };
};

const getSeedNotes = (): MindmapNote[] =>
  templateEntries.map((entry, index) => {
    const board = normalizeBoard(cloneBoard(entry.board));
    return {
      id: `seed-${index + 1}`,
      title: entry.title,
      nodes: board.nodes,
      edges: board.edges,
      updatedAt: Date.now() - index,
    };
  });

const readInitialNotes = (): MindmapNote[] => {
  const fallback = getSeedNotes();
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(STORAGE_NOTES_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as MindmapNote[];
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;

    return parsed
      .filter((note) => note?.id && note?.title)
      .map((note) => ({
        id: note.id,
        title: note.title,
        nodes: cloneNodes(note.nodes || []),
        edges: cloneEdges(note.edges || []),
        updatedAt: Number(note.updatedAt) || Date.now(),
      }));
  } catch {
    return fallback;
  }
};

const readInitialSelectedNoteId = (notes: MindmapNote[]): string | null => {
  if (typeof window === 'undefined') return notes[0]?.id ?? null;
  const saved = localStorage.getItem(STORAGE_SELECTED_NOTE_KEY);

  if (saved && notes.some((note) => note.id === saved)) {
    return saved;
  }

  return notes[0]?.id ?? null;
};

const buildMindmapMermaid = (
  nodes: MindmapNode[],
  edges: MindmapEdge[],
): string => {
  if (nodes.length === 0) return 'mindmap\n  root((Mindmap))';

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));

  edges.forEach((edge) => {
    if (indegree.has(edge.to)) {
      indegree.set(edge.to, (indegree.get(edge.to) || 0) + 1);
    }
  });

  const rootNode =
    nodes.find((node) => node.id === 'root') ||
    nodes.find((node) => (indegree.get(node.id) || 0) === 0) ||
    nodes[0];

  const children = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!children.has(edge.from)) {
      children.set(edge.from, []);
    }
    children.get(edge.from)?.push(edge.to);
  });

  const lines: string[] = [
    'mindmap',
    `  root((${rootNode.title.replace(/\n/g, ' ').trim() || 'Mindmap'}))`,
  ];

  const visited = new Set<string>();
  const walk = (nodeId: string, depth: number) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const kids = children.get(nodeId) || [];
    kids.forEach((kid) => {
      const node = byId.get(kid);
      if (!node) return;
      const safeTitle = node.title.replace(/\n/g, ' ').trim() || 'Untitled';
      lines.push(`${'  '.repeat(depth)}${safeTitle}`);
      walk(node.id, depth + 1);
    });
  };

  walk(rootNode.id, 2);
  return lines.join('\n');
};

const getTerminalDistanceToPointer = (
  node: MindmapNode,
  terminal: TerminalSide,
  pointerX: number,
  pointerY: number,
) => {
  if (terminal === 'top') {
    return Math.abs(pointerY - node.y);
  }

  if (terminal === 'right') {
    return Math.abs(pointerX - (node.x + NODE_WIDTH));
  }

  if (terminal === 'bottom') {
    return Math.abs(pointerY - (node.y + NODE_HEIGHT));
  }

  return Math.abs(pointerX - node.x);
};

const getSnapTerminalForNode = (
  node: MindmapNode,
  pointerX: number,
  pointerY: number,
): TerminalSide | null => {
  const minX = node.x - EDGE_SNAP_PADDING;
  const maxX = node.x + NODE_WIDTH + EDGE_SNAP_PADDING;
  const minY = node.y - EDGE_SNAP_PADDING;
  const maxY = node.y + NODE_HEIGHT + EDGE_SNAP_PADDING;

  if (
    pointerX < minX ||
    pointerX > maxX ||
    pointerY < minY ||
    pointerY > maxY
  ) {
    return null;
  }

  const terminals: TerminalSide[] = [];
  if (Math.abs(pointerY - node.y) <= EDGE_SNAP_DISTANCE) terminals.push('top');
  if (Math.abs(pointerX - (node.x + NODE_WIDTH)) <= EDGE_SNAP_DISTANCE)
    terminals.push('right');
  if (Math.abs(pointerY - (node.y + NODE_HEIGHT)) <= EDGE_SNAP_DISTANCE)
    terminals.push('bottom');
  if (Math.abs(pointerX - node.x) <= EDGE_SNAP_DISTANCE) terminals.push('left');

  if (terminals.length === 0) {
    return null;
  }

  return terminals.reduce((closest, terminal) => {
    const currentDistance = getTerminalDistanceToPointer(
      node,
      terminal,
      pointerX,
      pointerY,
    );
    const closestDistance = getTerminalDistanceToPointer(
      node,
      closest,
      pointerX,
      pointerY,
    );

    return currentDistance < closestDistance ? terminal : closest;
  });
};

export default function MindmapTool() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const hasCenteredViewportRef = useRef(false);
  const [sideView, setSideView] = useState<SideView>(() => readInitialSide());
  const [mindmapNotes, setMindmapNotes] = useState<MindmapNote[]>(() =>
    readInitialNotes(),
  );
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() =>
    readInitialSelectedNoteId(readInitialNotes()),
  );
  const [noteTitleInput, setNoteTitleInput] = useState(() => {
    const notes = readInitialNotes();
    const selectedId = readInitialSelectedNoteId(notes);
    const selected = notes.find((note) => note.id === selectedId);
    return selected?.title || '';
  });
  const [nodeKindToAdd, setNodeKindToAdd] = useState<NodeKind>('node');
  const [zoom, setZoom] = useState(() => readInitialZoom());
  const [boardNodes, setBoardNodes] = useState<MindmapNode[]>(() => {
    const notes = readInitialNotes();
    const selectedId = readInitialSelectedNoteId(notes);
    const selected = notes.find((note) => note.id === selectedId);
    return selected ? cloneNodes(selected.nodes) : defaultMindmapBoard().nodes;
  });
  const [boardEdges, setBoardEdges] = useState<MindmapEdge[]>(() => {
    const notes = readInitialNotes();
    const selectedId = readInitialSelectedNoteId(notes);
    const selected = notes.find((note) => note.id === selectedId);
    return selected ? cloneEdges(selected.edges) : defaultMindmapBoard().edges;
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<{
    nodeId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [connecting, setConnecting] = useState<{
    sourceNodeId: string;
    sourceTerminal: TerminalSide;
    pointerX: number;
    pointerY: number;
  } | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeTitle, setEditingNodeTitle] = useState('');
  const [editingNodeContent, setEditingNodeContent] = useState('');
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [panState, setPanState] = useState<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);

  const code = useMemo(
    () => buildMindmapMermaid(boardNodes, boardEdges),
    [boardEdges, boardNodes],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_CODE_KEY, code);
  }, [code]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SIDE_KEY, sideView);
  }, [sideView]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ZOOM_KEY, String(zoom));
  }, [zoom]);

  useEffect(() => {
    localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(mindmapNotes));
  }, [mindmapNotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SELECTED_NOTE_KEY, selectedNoteId || '');
  }, [selectedNoteId]);

  const outlineItems = useMemo(
    () =>
      code
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 80),
    [code],
  );

  const openMindmapNote = (noteId: string) => {
    const note = mindmapNotes.find((entry) => entry.id === noteId);
    if (!note) return;

    setBoardNodes(cloneNodes(note.nodes));
    setBoardEdges(cloneEdges(note.edges));
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setConnecting(null);
    setEditingNodeId(null);
    setSelectedNoteId(note.id);
    setNoteTitleInput(note.title);
    hasCenteredViewportRef.current = false;
  };

  const createMindmapNote = () => {
    const title = noteTitleInput.trim() || `Mindmap ${mindmapNotes.length + 1}`;
    const id = crypto.randomUUID();
    const nextNote: MindmapNote = {
      id,
      title,
      nodes: cloneNodes(boardNodes),
      edges: cloneEdges(boardEdges),
      updatedAt: Date.now(),
    };

    setMindmapNotes((current) => [nextNote, ...current]);
    setSelectedNoteId(id);
    setNoteTitleInput(title);
  };

  const updateMindmapNote = () => {
    if (!selectedNoteId) return;

    const selected = mindmapNotes.find((note) => note.id === selectedNoteId);
    if (!selected) return;

    const title = noteTitleInput.trim() || selected.title;
    setMindmapNotes((current) =>
      current.map((note) =>
        note.id === selectedNoteId
          ? {
              ...note,
              title,
              nodes: cloneNodes(boardNodes),
              edges: cloneEdges(boardEdges),
              updatedAt: Date.now(),
            }
          : note,
      ),
    );
    setNoteTitleInput(title);
  };

  const deleteMindmapNote = () => {
    if (!selectedNoteId) return;

    const remaining = mindmapNotes.filter((note) => note.id !== selectedNoteId);
    setMindmapNotes(remaining);

    const fallback = remaining[0];
    if (fallback) {
      setBoardNodes(cloneNodes(fallback.nodes));
      setBoardEdges(cloneEdges(fallback.edges));
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setConnecting(null);
      setEditingNodeId(null);
      setSelectedNoteId(fallback.id);
      setNoteTitleInput(fallback.title);
      hasCenteredViewportRef.current = false;
      return;
    }

    setSelectedNoteId(null);
    setNoteTitleInput('');
    clearMindmap();
  };

  const formatNoteDate = (timestamp: number) =>
    new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const findNode = (nodeId: string) =>
    boardNodes.find((node) => node.id === nodeId);

  const isNodeConnectable = (nodeId: string) => {
    const node = findNode(nodeId);
    const kind = node?.kind || 'node';
    return kind !== 'swimlane' && kind !== 'legend';
  };

  const isTerminalConnected = (nodeId: string, terminal: TerminalSide) =>
    boardEdges.some(
      (edge) =>
        (edge.from === nodeId && edge.fromTerminal === terminal) ||
        (edge.to === nodeId && edge.toTerminal === terminal),
    );

  const getNodeTerminalPoint = (nodeId: string, terminal: TerminalSide) => {
    const node = findNode(nodeId);
    if (!node) return { x: 0, y: 0 };

    if (terminal === 'top') {
      return { x: node.x + NODE_WIDTH / 2, y: node.y };
    }

    if (terminal === 'right') {
      return { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 };
    }

    if (terminal === 'bottom') {
      return { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEIGHT };
    }

    return { x: node.x, y: node.y + NODE_HEIGHT / 2 };
  };

  const getTerminalClassName = (terminal: TerminalSide) => {
    if (terminal === 'top') return MindmapToolStyles.NodeTerminalTop;
    if (terminal === 'right') return MindmapToolStyles.NodeTerminalRight;
    if (terminal === 'bottom') return MindmapToolStyles.NodeTerminalBottom;
    return MindmapToolStyles.NodeTerminalLeft;
  };

  const getTerminalDirection = (terminal: TerminalSide) => {
    if (terminal === 'top') return { x: 0, y: -1 };
    if (terminal === 'right') return { x: 1, y: 0 };
    if (terminal === 'bottom') return { x: 0, y: 1 };
    return { x: -1, y: 0 };
  };

  const buildEdgePath = (
    fromPoint: { x: number; y: number },
    toPoint: { x: number; y: number },
    fromTerminal: TerminalSide,
    toTerminal: TerminalSide,
  ): string => {
    const dx = toPoint.x - fromPoint.x;
    const dy = toPoint.y - fromPoint.y;
    const distance = Math.hypot(dx, dy);
    const pull = Math.max(50, Math.min(180, distance * 0.38));

    const fromDir = getTerminalDirection(fromTerminal);
    const toDir = getTerminalDirection(toTerminal);

    const c1 = {
      x: fromPoint.x + fromDir.x * pull,
      y: fromPoint.y + fromDir.y * pull,
    };
    const c2 = {
      x: toPoint.x + toDir.x * pull,
      y: toPoint.y + toDir.y * pull,
    };

    return `M ${fromPoint.x} ${fromPoint.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${toPoint.x} ${toPoint.y}`;
  };

  const getCanvasPoint = (event: ReactPointerEvent<HTMLElement>) => {
    const surface = canvasRef.current;
    if (!surface) return { x: 0, y: 0 };

    const rect = surface.getBoundingClientRect();
    const computed = window.getComputedStyle(surface);
    const paddingLeft = Number.parseFloat(computed.paddingLeft || '0') || 0;
    const paddingTop = Number.parseFloat(computed.paddingTop || '0') || 0;
    const scale = zoom / 100;

    const rawX =
      (event.clientX - rect.left - paddingLeft + surface.scrollLeft) / scale;
    const rawY =
      (event.clientY - rect.top - paddingTop + surface.scrollTop) / scale;

    return {
      x: clampToRange(rawX, 0, BOARD_WIDTH),
      y: clampToRange(rawY, 0, BOARD_HEIGHT),
    };
  };

  const startNodeDrag = (
    event: ReactPointerEvent<HTMLDivElement>,
    nodeId: string,
  ) => {
    if (isSpacePressed || editingNodeId === nodeId) return;
    event.stopPropagation();
    const node = findNode(nodeId);
    if (!node) return;
    const point = getCanvasPoint(event);
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setDraggingNode({
      nodeId,
      offsetX: point.x - node.x,
      offsetY: point.y - node.y,
    });
  };

  const startConnectionFromTerminal = (
    event: ReactPointerEvent<HTMLButtonElement>,
    nodeId: string,
    terminal: TerminalSide,
  ) => {
    if (isSpacePressed || !isNodeConnectable(nodeId)) return;
    event.stopPropagation();
    const point = getNodeTerminalPoint(nodeId, terminal);
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setConnecting({
      sourceNodeId: nodeId,
      sourceTerminal: terminal,
      pointerX: point.x,
      pointerY: point.y,
    });
  };

  const commitConnectionToTerminal = (
    nodeId: string,
    terminal: TerminalSide,
  ) => {
    if (!connecting || !isNodeConnectable(nodeId)) return;
    if (
      connecting.sourceNodeId === nodeId &&
      connecting.sourceTerminal === terminal
    ) {
      setConnecting(null);
      return;
    }

    const exists = boardEdges.some(
      (edge) =>
        edge.from === connecting.sourceNodeId &&
        edge.to === nodeId &&
        edge.fromTerminal === connecting.sourceTerminal &&
        edge.toTerminal === terminal,
    );
    if (exists) {
      setConnecting(null);
      return;
    }

    const edgeId = crypto.randomUUID();
    setBoardEdges((current) => [
      ...current,
      {
        id: edgeId,
        from: connecting.sourceNodeId,
        to: nodeId,
        fromTerminal: connecting.sourceTerminal,
        toTerminal: terminal,
      },
    ]);
    setSelectedEdgeId(edgeId);
    setConnecting(null);
  };

  useEffect(() => {
    const release = () => {
      setDraggingNode(null);
      if (connecting) {
        setConnecting(null);
      }
      setIsPanningCanvas(false);
      setPanState(null);
    };

    window.addEventListener('pointerup', release);
    return () => window.removeEventListener('pointerup', release);
  }, [connecting]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      setDraggingNode(null);
      setConnecting(null);
      setIsSpacePressed(true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    const onBlur = () => {
      setDraggingNode(null);
      setConnecting(null);
      setIsSpacePressed(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    if (hasCenteredViewportRef.current) return;

    const surface = canvasRef.current;
    if (!surface) return;

    const centerX = Math.max(0, (BOARD_WIDTH - surface.clientWidth) / 2);
    const centerY = Math.max(0, (BOARD_HEIGHT - surface.clientHeight) / 2);
    surface.scrollLeft = centerX;
    surface.scrollTop = centerY;
    hasCenteredViewportRef.current = true;
  }, [boardNodes.length]);

  const beginCanvasPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isSpacePressed) {
      const target = event.target as Element;
      const blocked = target.closest('[data-pan-block="true"]');
      if (blocked) return;
    }

    const surface = canvasRef.current;
    if (!surface) return;

    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setIsPanningCanvas(true);
    setPanState({
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startScrollLeft: surface.scrollLeft,
      startScrollTop: surface.scrollTop,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveCanvasPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (panState && panState.pointerId === event.pointerId) {
      const surface = canvasRef.current;
      if (surface) {
        const dx = event.clientX - panState.startClientX;
        const dy = event.clientY - panState.startClientY;
        surface.scrollLeft = panState.startScrollLeft - dx;
        surface.scrollTop = panState.startScrollTop - dy;
      }
    }
  };

  const endCanvasPan = () => {
    setIsPanningCanvas(false);
    setPanState(null);
  };

  const revealedTerminalTarget = useMemo(() => {
    if (!connecting) return null;

    const pointerX = connecting.pointerX;
    const pointerY = connecting.pointerY;

    const bestTarget = boardNodes.reduce<{
      nodeId: string;
      terminal: TerminalSide;
      distance: number;
    } | null>((currentBest, node) => {
      const terminal = getSnapTerminalForNode(node, pointerX, pointerY);
      if (!terminal) return currentBest;

      const nodeKind = node.kind || 'node';
      if (nodeKind === 'swimlane' || nodeKind === 'legend') {
        return currentBest;
      }

      if (
        node.id === connecting.sourceNodeId &&
        terminal === connecting.sourceTerminal
      ) {
        return currentBest;
      }

      const distance = getTerminalDistanceToPointer(
        node,
        terminal,
        pointerX,
        pointerY,
      );

      if (!currentBest || distance < currentBest.distance) {
        return { nodeId: node.id, terminal, distance };
      }

      return currentBest;
    }, null);

    if (!bestTarget) return null;

    const resolvedTarget = bestTarget as {
      nodeId: string;
      terminal: TerminalSide;
      distance: number;
    };

    return { nodeId: resolvedTarget.nodeId, terminal: resolvedTarget.terminal };
  }, [boardNodes, connecting]);

  const disconnectEdge = (edgeId: string) => {
    setBoardEdges((current) => current.filter((edge) => edge.id !== edgeId));
    setSelectedEdgeId(null);
  };

  const commitNodeTitleEdit = () => {
    if (!editingNodeId) return;
    const nextTitle = editingNodeTitle.trim();
    if (!nextTitle) {
      setEditingNodeId(null);
      return;
    }
    setBoardNodes((current) =>
      current.map((node) =>
        node.id === editingNodeId
          ? {
              ...node,
              title: nextTitle,
              content: editingNodeContent.trim(),
            }
          : node,
      ),
    );
    setEditingNodeId(null);
  };

  const openNodeEditor = (node: MindmapNode) => {
    setEditingNodeId(node.id);
    setEditingNodeTitle(node.title);
    setEditingNodeContent(node.content || '');
  };

  const closeNodeEditor = () => {
    setEditingNodeId(null);
  };

  const addNode = () => {
    const id = crypto.randomUUID();
    const nextIndex = boardNodes.length + 1;
    const nextNode: MindmapNode = {
      id,
      kind: nodeKindToAdd,
      title: getDefaultTitleForKind(nodeKindToAdd, nextIndex),
      content: getDefaultContentForKind(nodeKindToAdd),
      x: BOARD_WIDTH / 2 - NODE_WIDTH / 2,
      y: BOARD_HEIGHT / 2 - NODE_HEIGHT / 2,
    };
    setBoardNodes((current) => [...current, nextNode]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  };

  const deleteSelection = () => {
    if (selectedEdgeId) {
      setBoardEdges((current) =>
        current.filter((edge) => edge.id !== selectedEdgeId),
      );
      setSelectedEdgeId(null);
      return;
    }

    if (selectedNodeId) {
      setBoardNodes((current) =>
        current.filter((node) => node.id !== selectedNodeId),
      );
      setBoardEdges((current) =>
        current.filter(
          (edge) => edge.from !== selectedNodeId && edge.to !== selectedNodeId,
        ),
      );
      setSelectedNodeId(null);
    }
  };

  const clearMindmap = () => {
    const root: MindmapNode = {
      id: 'root',
      title: 'Mindmap Root',
      kind: 'node',
      content: '',
      x: BOARD_WIDTH / 2 - NODE_WIDTH / 2,
      y: BOARD_HEIGHT / 2 - NODE_HEIGHT / 2,
    };
    setBoardNodes([root]);
    setBoardEdges([]);
    setSelectedNodeId(root.id);
    setSelectedEdgeId(null);
  };

  const editingNode = useMemo(
    () =>
      editingNodeId
        ? boardNodes.find((node) => node.id === editingNodeId) || null
        : null,
    [boardNodes, editingNodeId],
  );

  const editingNodeKind = editingNode?.kind || 'node';

  return (
    <Section
      id='mindmap-tool'
      className={MindmapToolStyles.MindmapTool}
    >
      <header className={MindmapToolStyles.Topbar}>
        <div className={MindmapToolStyles.TopbarLeft}>
          <h2 className={MindmapToolStyles.Title}>Mindmap Tool</h2>
          <p className={MindmapToolStyles.Subtitle}>
            Interactive workspace for planning and visual thinking.
          </p>
        </div>
      </header>

      <div className={MindmapToolStyles.Workspace}>
        <aside className={MindmapToolStyles.Sidebar}>
          <div className={MindmapToolStyles.SidebarTabs}>
            <button
              className={[
                MindmapToolStyles.SidebarTab,
                sideView === 'mindmaps'
                  ? MindmapToolStyles.SidebarTabActive
                  : '',
              ].join(' ')}
              type='button'
              onClick={() => setSideView('mindmaps')}
            >
              Mindmaps
            </button>
            <button
              className={[
                MindmapToolStyles.SidebarTab,
                sideView === 'outline'
                  ? MindmapToolStyles.SidebarTabActive
                  : '',
              ].join(' ')}
              type='button'
              onClick={() => setSideView('outline')}
            >
              Outline
            </button>
          </div>

          {sideView === 'mindmaps' && (
            <>
              <div className={MindmapToolStyles.NoteControls}>
                <input
                  className={MindmapToolStyles.Textarea}
                  value={noteTitleInput}
                  onChange={(event) => setNoteTitleInput(event.target.value)}
                  placeholder='Mindmap title'
                  aria-label='Mindmap title'
                />
                <div className={MindmapToolStyles.NoteActions}>
                  <button
                    type='button'
                    className={MindmapToolStyles.ActionButton}
                    onClick={createMindmapNote}
                  >
                    Create
                  </button>
                  <button
                    type='button'
                    className={MindmapToolStyles.ActionButton}
                    onClick={updateMindmapNote}
                    disabled={!selectedNoteId}
                  >
                    Update
                  </button>
                  <button
                    type='button'
                    className={MindmapToolStyles.ActionButton}
                    onClick={deleteMindmapNote}
                    disabled={!selectedNoteId}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className={MindmapToolStyles.TemplateGrid}>
                {mindmapNotes.map((entry) => (
                  <button
                    key={entry.id}
                    className={[
                      MindmapToolStyles.TemplateCard,
                      selectedNoteId === entry.id
                        ? MindmapToolStyles.NoteItemActive
                        : '',
                    ].join(' ')}
                    type='button'
                    onClick={() => openMindmapNote(entry.id)}
                  >
                    <strong>{entry.title}</strong>
                    <span>{formatNoteDate(entry.updatedAt)}</span>
                  </button>
                ))}
                {mindmapNotes.length === 0 && (
                  <p className={MindmapToolStyles.NoteEmpty}>
                    No mindmaps yet.
                  </p>
                )}
              </div>
            </>
          )}

          {sideView === 'outline' && (
            <ul className={MindmapToolStyles.OutlineList}>
              {outlineItems.length === 0 && <li>Nothing to show.</li>}
              {outlineItems.map((line, index) => (
                <li key={`${line}-${index}`}>{line}</li>
              ))}
            </ul>
          )}
        </aside>

        <main className={MindmapToolStyles.Stage}>
          <div className={MindmapToolStyles.ToolbarFloating}>
            <div className={MindmapToolStyles.ZoomControl}>
              <button
                className={MindmapToolStyles.ActionButton}
                type='button'
                onClick={() => setZoom((value) => Math.max(50, value - 10))}
              >
                -
              </button>
              <span>{zoom}%</span>
              <button
                className={MindmapToolStyles.ActionButton}
                type='button'
                onClick={() => setZoom((value) => Math.min(180, value + 10))}
              >
                +
              </button>
            </div>
          </div>

          <div className={MindmapToolStyles.BoardToolbar}>
            <select
              className={MindmapToolStyles.NodeKindSelect}
              value={nodeKindToAdd}
              onChange={(event) =>
                setNodeKindToAdd(event.target.value as NodeKind)
              }
              aria-label='Element type'
            >
              {nodeKindOptions.map((entry) => (
                <option
                  key={entry.kind}
                  value={entry.kind}
                >
                  {`${entry.icon} ${entry.label}`}
                </option>
              ))}
            </select>
            <button
              type='button'
              className={MindmapToolStyles.ActionButton}
              onClick={addNode}
            >
              Add Element
            </button>
            <button
              type='button'
              className={MindmapToolStyles.ActionButton}
              onClick={deleteSelection}
            >
              Delete Selection
            </button>
            <button
              type='button'
              className={MindmapToolStyles.ActionButton}
              onClick={clearMindmap}
            >
              Reset Board
            </button>
            <span className={MindmapToolStyles.BoardHint}>
              16 element types available • Click node to reveal 4 terminals •
              Connected terminals stay visible • Drag connector near an edge to
              reveal and connect • Hold Space + drag to pan
            </span>
          </div>

          <div
            ref={(element) => {
              stageRef.current = element;
              canvasRef.current = element;
            }}
            data-pan-surface='true'
            className={[
              MindmapToolStyles.PreviewCanvas,
              MindmapToolStyles.PreviewCanvasMindmap,
              MindmapToolStyles.PreviewCanvasDraggable,
              isPanningCanvas || isSpacePressed
                ? MindmapToolStyles.PreviewCanvasDragging
                : '',
            ].join(' ')}
            onPointerDown={beginCanvasPan}
            onPointerMove={(event) => {
              moveCanvasPan(event);

              const point = getCanvasPoint(event);
              if (draggingNode) {
                setBoardNodes((current) =>
                  current.map((node) =>
                    node.id === draggingNode.nodeId
                      ? {
                          ...node,
                          x: point.x - draggingNode.offsetX,
                          y: point.y - draggingNode.offsetY,
                        }
                      : node,
                  ),
                );
              }

              if (connecting) {
                setConnecting({
                  ...connecting,
                  pointerX: point.x,
                  pointerY: point.y,
                });
              }
            }}
            onPointerUp={() => {
              setDraggingNode(null);
              if (connecting) {
                setConnecting(null);
              }
              endCanvasPan();
            }}
            onPointerLeave={() => {
              setDraggingNode(null);
            }}
          >
            <div
              className={MindmapToolStyles.BoardStage}
              style={{ transform: `scale(${zoom / 100})` }}
              onPointerDown={() => {
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
              }}
            >
              <svg
                className={MindmapToolStyles.BoardSvg}
                width={BOARD_WIDTH}
                height={BOARD_HEIGHT}
                viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
              >
                {boardEdges.map((edge) => {
                  const from = getNodeTerminalPoint(
                    edge.from,
                    edge.fromTerminal,
                  );
                  const to = getNodeTerminalPoint(edge.to, edge.toTerminal);
                  const isSelected = edge.id === selectedEdgeId;
                  const path = buildEdgePath(
                    from,
                    to,
                    edge.fromTerminal,
                    edge.toTerminal,
                  );

                  return (
                    <g key={edge.id}>
                      <path
                        d={path}
                        className={[
                          MindmapToolStyles.EdgeLine,
                          isSelected ? MindmapToolStyles.EdgeLineSelected : '',
                        ].join(' ')}
                      />
                      <path
                        d={path}
                        className={MindmapToolStyles.EdgeLineHit}
                        data-pan-block='true'
                        onClick={(event) => {
                          event.stopPropagation();
                          disconnectEdge(edge.id);
                        }}
                      />
                    </g>
                  );
                })}

                {connecting && (
                  <path
                    d={buildEdgePath(
                      getNodeTerminalPoint(
                        connecting.sourceNodeId,
                        connecting.sourceTerminal,
                      ),
                      {
                        x: connecting.pointerX,
                        y: connecting.pointerY,
                      },
                      connecting.sourceTerminal,
                      'left',
                    )}
                    className={MindmapToolStyles.EdgeLineGhost}
                  />
                )}
              </svg>

              {boardNodes.map((node) => {
                const isSelected = node.id === selectedNodeId;
                const nodeKind = node.kind || 'node';
                const kindMeta = getNodeKindMeta(nodeKind);
                const kindCss =
                  MindmapToolStyles[
                    kindMeta.className as keyof typeof MindmapToolStyles
                  ] || '';

                return (
                  <div
                    key={node.id}
                    data-pan-block='true'
                    className={[
                      MindmapToolStyles.BoardNode,
                      kindCss,
                      isSelected ? MindmapToolStyles.BoardNodeSelected : '',
                    ].join(' ')}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: `${NODE_WIDTH}px`,
                      height: `${NODE_HEIGHT}px`,
                    }}
                    onPointerDown={(event) => startNodeDrag(event, node.id)}
                    onPointerUp={(event) => {
                      if (
                        connecting &&
                        revealedTerminalTarget &&
                        revealedTerminalTarget.nodeId === node.id
                      ) {
                        event.stopPropagation();
                        commitConnectionToTerminal(
                          node.id,
                          revealedTerminalTarget.terminal,
                        );
                        return;
                      }

                      if (draggingNode) {
                        setDraggingNode(null);
                      }
                      setSelectedNodeId(node.id);
                      setSelectedEdgeId(null);
                    }}
                  >
                    <button
                      type='button'
                      className={MindmapToolStyles.NodeQuickEdit}
                      data-pan-block='true'
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        openNodeEditor(node);
                      }}
                      aria-label={`Edit ${node.title}`}
                    >
                      {'>_'}
                    </button>

                    <div className={MindmapToolStyles.NodeContent}>
                      <span className={MindmapToolStyles.NodeKindLabel}>
                        {kindMeta.label}
                      </span>
                      <span className={MindmapToolStyles.NodeTitle}>
                        {node.title}
                      </span>
                    </div>

                    {terminalSides.map((terminal) => {
                      const isConnectableNode = isNodeConnectable(node.id);
                      const isSelectedNode = node.id === selectedNodeId;
                      const isConnected = isTerminalConnected(
                        node.id,
                        terminal,
                      );
                      const isSourceTerminal =
                        connecting?.sourceNodeId === node.id &&
                        connecting.sourceTerminal === terminal;
                      const isRevealedTarget =
                        revealedTerminalTarget?.nodeId === node.id &&
                        revealedTerminalTarget.terminal === terminal;

                      if (
                        !isConnectableNode ||
                        (!isSelectedNode &&
                          !isConnected &&
                          !isSourceTerminal &&
                          !isRevealedTarget)
                      ) {
                        return null;
                      }

                      return (
                        <button
                          key={`${node.id}-${terminal}`}
                          type='button'
                          className={[
                            MindmapToolStyles.NodeTerminal,
                            getTerminalClassName(terminal),
                          ].join(' ')}
                          data-pan-block='true'
                          onPointerDown={(event) =>
                            startConnectionFromTerminal(
                              event,
                              node.id,
                              terminal,
                            )
                          }
                          onPointerUp={(event) => {
                            event.stopPropagation();
                            if (connecting) {
                              commitConnectionToTerminal(node.id, terminal);
                            }
                          }}
                          aria-label={`${terminal} terminal for ${node.title}`}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {editingNode && (
          <div
            className={MindmapToolStyles.NodeEditorOverlay}
            onClick={closeNodeEditor}
          >
            <div
              className={MindmapToolStyles.NodeEditorModal}
              onClick={(event) => event.stopPropagation()}
            >
              <h4 className={MindmapToolStyles.NodeEditorTitle}>
                Edit {getNodeKindMeta(editingNodeKind).label}
              </h4>
              <input
                className={MindmapToolStyles.NodeInput}
                value={editingNodeTitle}
                onChange={(event) => setEditingNodeTitle(event.target.value)}
                placeholder='Title'
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    closeNodeEditor();
                  }
                }}
              />
              <textarea
                className={MindmapToolStyles.NodeInput}
                value={editingNodeContent}
                rows={6}
                placeholder={getContentPlaceholderForKind(editingNodeKind)}
                onChange={(event) => setEditingNodeContent(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    (event.ctrlKey || event.metaKey) &&
                    event.key === 'Enter'
                  ) {
                    event.preventDefault();
                    commitNodeTitleEdit();
                  }
                  if (event.key === 'Escape') {
                    closeNodeEditor();
                  }
                }}
              />
              <div className={MindmapToolStyles.NodeEditorActions}>
                <button
                  type='button'
                  className={MindmapToolStyles.ActionButton}
                  onClick={closeNodeEditor}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className={MindmapToolStyles.ActionButton}
                  onClick={commitNodeTitleEdit}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
