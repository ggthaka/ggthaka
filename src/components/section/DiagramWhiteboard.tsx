'use client';

import { Section } from '@components/layout';
import { DiagramWhiteboardStyles } from '@styles/section';
import { useEffect, useMemo, useRef, useState } from 'react';

type DiagramKind = 'flowchart' | 'er' | 'mindmap';
type WorkspaceView = 'diagram' | 'whiteboard';
type SideView = 'components' | 'outline';
type InkTone = 'primary' | 'highlight' | 'text';

interface TemplateEntry {
  title: string;
  description: string;
  kind: DiagramKind;
  code: string;
}

const templateEntries: TemplateEntry[] = [
  {
    title: 'Service Flow',
    description: 'Map user requests and service boundaries.',
    kind: 'flowchart',
    code: `flowchart TD
  A[Client App] --> B{Auth Token}
  B -->|Valid| C[Gateway]
  B -->|Missing| D[Auth Service]
  C --> E[User Service]
  C --> F[Blog Service]
  F --> G[(PostgreSQL)]`,
  },
  {
    title: 'Data Model',
    description: 'Visualize entities and relationships.',
    kind: 'er',
    code: `erDiagram
  USER ||--o{ BLOG : creates
  BLOG ||--o{ COMMENT : contains
  USER ||--o{ SESSION : owns

  USER {
    uuid id PK
    string email
    string role
  }
  BLOG {
    uuid id PK
    string slug
    string title
  }
  COMMENT {
    uuid id PK
    string content
  }
  SESSION {
    uuid id PK
    string device
  }`,
  },
  {
    title: 'Launch Board',
    description: 'Presentation-ready product launch command center.',
    kind: 'mindmap',
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
  },
  {
    title: 'Innovation Map',
    description: 'Clean executive map for roadmap storytelling.',
    kind: 'mindmap',
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
  },
];

const STORAGE_KEY = 'tool-diagram-whiteboard-code';
const STORAGE_VIEW_KEY = 'tool-diagram-whiteboard-view';
const STORAGE_SIDE_KEY = 'tool-diagram-whiteboard-side';
const PREVIEW_PAN_WIDTH = 2200;
const PREVIEW_PAN_HEIGHT = 1500;

const readInitialCode = (): string => {
  if (typeof window === 'undefined') return templateEntries[0].code;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return templateEntries[0].code;
    return raw;
  } catch {
    return templateEntries[0].code;
  }
};

const readInitialWorkspaceView = (): WorkspaceView => {
  if (typeof window === 'undefined') return 'diagram';
  const raw = localStorage.getItem(STORAGE_VIEW_KEY);
  return raw === 'whiteboard' ? 'whiteboard' : 'diagram';
};

const readInitialSideView = (): SideView => {
  if (typeof window === 'undefined') return 'components';
  const raw = localStorage.getItem(STORAGE_SIDE_KEY);
  return raw === 'outline' ? 'outline' : 'components';
};

const inkToneToCss = (tone: InkTone): string => {
  if (tone === 'highlight') return 'var(--color-highlight)';
  if (tone === 'text') return 'currentColor';
  return 'var(--color-primary)';
};

const extractMermaidSource = (value: string): string => {
  const markdownFence = value.match(
    /```\s*(?:mermaid|flowchart|mmd)\s*\n([\s\S]*?)```/i,
  );

  if (markdownFence?.[1]) {
    return markdownFence[1].trim();
  }

  return value.trim();
};

export default function DiagramWhiteboard() {
  const previewSurfaceRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>(() =>
    readInitialWorkspaceView(),
  );
  const [sideView, setSideView] = useState<SideView>(() =>
    readInitialSideView(),
  );
  const [diagramKind, setDiagramKind] = useState<DiagramKind>('flowchart');
  const [code, setCode] = useState(() => readInitialCode());
  const [svg, setSvg] = useState('');
  const [renderError, setRenderError] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [lineWidth, setLineWidth] = useState(2);
  const [inkTone, setInkTone] = useState<InkTone>('primary');
  const [isPanningDiagram, setIsPanningDiagram] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [panState, setPanState] = useState<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);
  const [hasCenteredDiagramViewport, setHasCenteredDiagramViewport] =
    useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, code);
  }, [code]);

  useEffect(() => {
    localStorage.setItem(STORAGE_VIEW_KEY, workspaceView);
  }, [workspaceView]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SIDE_KEY, sideView);
  }, [sideView]);

  const renderDiagram = async (value: string) => {
    setIsRendering(true);
    setRenderError('');

    const source = extractMermaidSource(value);

    if (!source) {
      setRenderError('No Mermaid content found to render.');
      setSvg('');
      setIsRendering(false);
      return;
    }

    try {
      const response = await fetch('https://kroki.io/mermaid/svg', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: source,
      });

      if (!response.ok) {
        throw new Error(`Failed to render diagram (${response.status}).`);
      }

      const text = await response.text();
      setSvg(text);
    } catch (caught) {
      setRenderError(
        caught instanceof Error
          ? caught.message
          : 'Failed to render diagram. Verify Mermaid syntax.',
      );
      setSvg('');
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      renderDiagram(code);
    }, 300);

    return () => window.clearTimeout(handle);
  }, [code]);

  useEffect(() => {
    setHasCenteredDiagramViewport(false);
  }, [diagramKind]);

  useEffect(() => {
    if (workspaceView !== 'diagram') {
      setHasCenteredDiagramViewport(false);
      return;
    }

    if (hasCenteredDiagramViewport) return;

    const surface = previewSurfaceRef.current;
    if (!surface) return;

    const centerX = Math.max(0, (PREVIEW_PAN_WIDTH - surface.clientWidth) / 2);
    const centerY = Math.max(
      0,
      (PREVIEW_PAN_HEIGHT - surface.clientHeight) / 2,
    );
    surface.scrollLeft = centerX;
    surface.scrollTop = centerY;
    setHasCenteredDiagramViewport(true);
  }, [workspaceView, hasCenteredDiagramViewport]);

  useEffect(() => {
    const release = () => {
      setIsPanningDiagram(false);
      setPanState(null);
    };

    window.addEventListener('pointerup', release);
    return () => window.removeEventListener('pointerup', release);
  }, []);

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
      setIsSpacePressed(true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    const onBlur = () => {
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

  const beginDiagramPan = (event: React.PointerEvent<HTMLDivElement>) => {
    const surface = previewSurfaceRef.current;
    if (!surface) return;

    setIsPanningDiagram(true);
    setPanState({
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startScrollLeft: surface.scrollLeft,
      startScrollTop: surface.scrollTop,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDiagramPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!panState || panState.pointerId !== event.pointerId) return;
    const surface = previewSurfaceRef.current;
    if (!surface) return;

    const dx = event.clientX - panState.startClientX;
    const dy = event.clientY - panState.startClientY;
    surface.scrollLeft = panState.startScrollLeft - dx;
    surface.scrollTop = panState.startScrollTop - dy;
  };

  const endDiagramPan = () => {
    setIsPanningDiagram(false);
    setPanState(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = lineWidth;
    context.strokeStyle = inkToneToCss(inkTone);
  }, [inkTone, lineWidth]);

  const outlineItems = useMemo(
    () =>
      code
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 80),
    [code],
  );

  const selectTemplate = (entry: TemplateEntry) => {
    setDiagramKind(entry.kind);
    setCode(entry.code);
    setWorkspaceView('diagram');
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const beginDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
  };

  const moveDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    context.stroke();
  };

  const endDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    drawingRef.current = false;
  };

  return (
    <Section
      id='diagram-whiteboard'
      className={DiagramWhiteboardStyles.DiagramWhiteboard}
    >
      <header className={DiagramWhiteboardStyles.Topbar}>
        <div className={DiagramWhiteboardStyles.TopbarLeft}>
          <h2 className={DiagramWhiteboardStyles.Title}>
            Diagram & Whiteboard
          </h2>
          <p className={DiagramWhiteboardStyles.Subtitle}>
            Visual workspace for architecture, data design, and collaborative
            ideation.
          </p>
        </div>

        <div className={DiagramWhiteboardStyles.TopbarActions}>
          <button
            className={[
              DiagramWhiteboardStyles.ViewToggle,
              workspaceView === 'diagram'
                ? DiagramWhiteboardStyles.ViewToggleActive
                : '',
            ].join(' ')}
            type='button'
            onClick={() => setWorkspaceView('diagram')}
          >
            Diagram
          </button>
          <button
            className={[
              DiagramWhiteboardStyles.ViewToggle,
              workspaceView === 'whiteboard'
                ? DiagramWhiteboardStyles.ViewToggleActive
                : '',
            ].join(' ')}
            type='button'
            onClick={() => setWorkspaceView('whiteboard')}
          >
            Whiteboard
          </button>
          <button
            className={DiagramWhiteboardStyles.ActionButton}
            type='button'
            onClick={() => renderDiagram(code)}
          >
            Refresh Preview
          </button>
        </div>
      </header>

      <div className={DiagramWhiteboardStyles.Workspace}>
        <aside className={DiagramWhiteboardStyles.Sidebar}>
          <div className={DiagramWhiteboardStyles.SidebarTabs}>
            <button
              className={[
                DiagramWhiteboardStyles.SidebarTab,
                sideView === 'components'
                  ? DiagramWhiteboardStyles.SidebarTabActive
                  : '',
              ].join(' ')}
              type='button'
              onClick={() => setSideView('components')}
            >
              Components
            </button>
            <button
              className={[
                DiagramWhiteboardStyles.SidebarTab,
                sideView === 'outline'
                  ? DiagramWhiteboardStyles.SidebarTabActive
                  : '',
              ].join(' ')}
              type='button'
              onClick={() => setSideView('outline')}
            >
              Outline
            </button>
          </div>

          {sideView === 'components' && (
            <div className={DiagramWhiteboardStyles.TemplateGrid}>
              {templateEntries.map((entry) => (
                <button
                  key={entry.title}
                  className={DiagramWhiteboardStyles.TemplateCard}
                  type='button'
                  onClick={() => selectTemplate(entry)}
                >
                  <strong>{entry.title}</strong>
                  <span>{entry.description}</span>
                </button>
              ))}
            </div>
          )}

          {sideView === 'outline' && (
            <ul className={DiagramWhiteboardStyles.OutlineList}>
              {outlineItems.length === 0 && <li>Nothing to show.</li>}
              {outlineItems.map((line, index) => (
                <li key={`${line}-${index}`}>{line}</li>
              ))}
            </ul>
          )}
        </aside>

        <main className={DiagramWhiteboardStyles.Stage}>
          {workspaceView === 'diagram' && (
            <>
              <div className={DiagramWhiteboardStyles.ToolbarFloating}>
                <select
                  className={DiagramWhiteboardStyles.Select}
                  value={diagramKind}
                  onChange={(event) =>
                    setDiagramKind(event.target.value as DiagramKind)
                  }
                  aria-label='Diagram type'
                >
                  <option value='flowchart'>Flowchart</option>
                  <option value='er'>ER Diagram</option>
                  <option value='mindmap'>Mind Map</option>
                </select>

                <button
                  className={DiagramWhiteboardStyles.ActionButton}
                  type='button'
                  onClick={() => {
                    const match = templateEntries.find(
                      (entry) => entry.kind === diagramKind,
                    );
                    if (match) setCode(match.code);
                  }}
                >
                  Template
                </button>

                <div className={DiagramWhiteboardStyles.ZoomControl}>
                  <button
                    className={DiagramWhiteboardStyles.ActionButton}
                    type='button'
                    onClick={() => setZoom((value) => Math.max(50, value - 10))}
                  >
                    -
                  </button>
                  <span>{zoom}%</span>
                  <button
                    className={DiagramWhiteboardStyles.ActionButton}
                    type='button'
                    onClick={() =>
                      setZoom((value) => Math.min(180, value + 10))
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              <div
                ref={previewSurfaceRef}
                className={[
                  DiagramWhiteboardStyles.PreviewCanvas,
                  DiagramWhiteboardStyles.PreviewCanvasDraggable,
                  diagramKind === 'mindmap'
                    ? DiagramWhiteboardStyles.PreviewCanvasMindmap
                    : '',
                  isPanningDiagram || isSpacePressed
                    ? DiagramWhiteboardStyles.PreviewCanvasDragging
                    : '',
                ].join(' ')}
                onPointerDown={beginDiagramPan}
                onPointerMove={moveDiagramPan}
                onPointerUp={endDiagramPan}
                onPointerLeave={endDiagramPan}
              >
                {isRendering && (
                  <p className={DiagramWhiteboardStyles.Message}>
                    Rendering...
                  </p>
                )}
                {renderError && (
                  <p className={DiagramWhiteboardStyles.Error}>{renderError}</p>
                )}
                {!renderError && !isRendering && !svg && (
                  <p className={DiagramWhiteboardStyles.Message}>
                    Preview will appear here.
                  </p>
                )}

                {svg && (
                  <div
                    className={DiagramWhiteboardStyles.PreviewPanSpace}
                    style={{ transform: `scale(${zoom / 100})` }}
                  >
                    <div
                      className={DiagramWhiteboardStyles.Preview}
                      dangerouslySetInnerHTML={{ __html: svg }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {workspaceView === 'whiteboard' && (
            <>
              <div className={DiagramWhiteboardStyles.ToolbarFloating}>
                <label className={DiagramWhiteboardStyles.LabelInline}>
                  Width
                  <input
                    className={DiagramWhiteboardStyles.Range}
                    type='range'
                    min={1}
                    max={8}
                    value={lineWidth}
                    onChange={(event) =>
                      setLineWidth(Number(event.target.value))
                    }
                  />
                </label>

                <div className={DiagramWhiteboardStyles.InkGroup}>
                  {(['primary', 'highlight', 'text'] as InkTone[]).map(
                    (tone) => (
                      <button
                        key={tone}
                        className={[
                          DiagramWhiteboardStyles.InkButton,
                          inkTone === tone
                            ? DiagramWhiteboardStyles.InkButtonActive
                            : '',
                        ].join(' ')}
                        type='button'
                        onClick={() => setInkTone(tone)}
                      >
                        {tone}
                      </button>
                    ),
                  )}
                </div>

                <button
                  className={DiagramWhiteboardStyles.ActionButton}
                  type='button'
                  onClick={clearCanvas}
                >
                  Clear
                </button>
                <button
                  className={DiagramWhiteboardStyles.ActionButton}
                  type='button'
                  onClick={exportCanvas}
                >
                  Export PNG
                </button>
              </div>

              <canvas
                ref={canvasRef}
                className={DiagramWhiteboardStyles.Canvas}
                onPointerDown={beginDraw}
                onPointerMove={moveDraw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
                aria-label='Whiteboard canvas'
              />
            </>
          )}
        </main>

        <aside className={DiagramWhiteboardStyles.Inspector}>
          <h3 className={DiagramWhiteboardStyles.InspectorTitle}>Inspector</h3>
          <div className={DiagramWhiteboardStyles.InspectorGrid}>
            <div>
              <span className={DiagramWhiteboardStyles.InspectorLabel}>
                Current Mode
              </span>
              <strong>
                {workspaceView === 'diagram' ? 'Diagram Builder' : 'Whiteboard'}
              </strong>
            </div>
            <div>
              <span className={DiagramWhiteboardStyles.InspectorLabel}>
                Diagram Type
              </span>
              <strong>{diagramKind.toUpperCase()}</strong>
            </div>
            <div>
              <span className={DiagramWhiteboardStyles.InspectorLabel}>
                Lines of Code
              </span>
              <strong>{code.split('\n').length}</strong>
            </div>
            <div>
              <span className={DiagramWhiteboardStyles.InspectorLabel}>
                Render Status
              </span>
              <strong>
                {renderError ? 'Error' : isRendering ? 'Rendering' : 'Ready'}
              </strong>
            </div>
          </div>

          <label className={DiagramWhiteboardStyles.TextareaLabel}>
            Mermaid or Markdown Source
          </label>
          <textarea
            className={DiagramWhiteboardStyles.Textarea}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            rows={16}
            placeholder='Write Mermaid syntax, or paste Markdown with ```mermaid ... ``` blocks.'
            aria-label='Mermaid or markdown diagram code'
          />
        </aside>
      </div>
    </Section>
  );
}
