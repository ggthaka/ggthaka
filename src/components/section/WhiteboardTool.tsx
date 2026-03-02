'use client';

import { Section } from '@components/layout';
import { WhiteboardToolStyles } from '@styles/section';
import { useCallback, useEffect, useRef, useState } from 'react';

type InkTone = 'primary' | 'highlight' | 'text';

const STORAGE_WIDTH_KEY = 'tool-whiteboard-line-width';
const STORAGE_TONE_KEY = 'tool-whiteboard-ink-tone';

const readInitialWidth = (): number => {
  if (typeof window === 'undefined') return 2;
  const value = Number(localStorage.getItem(STORAGE_WIDTH_KEY) || '2');
  if (!Number.isFinite(value)) return 2;
  return Math.max(1, Math.min(8, value));
};

const readInitialTone = (): InkTone => {
  if (typeof window === 'undefined') return 'primary';
  const value = localStorage.getItem(STORAGE_TONE_KEY);
  if (value === 'highlight' || value === 'text') return value;
  return 'primary';
};

const inkToneToCss = (tone: InkTone): string => {
  if (tone === 'highlight') return 'var(--color-highlight)';
  if (tone === 'text') return 'currentColor';
  return 'var(--color-primary)';
};

export default function WhiteboardTool() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [lineWidth, setLineWidth] = useState(() => readInitialWidth());
  const [inkTone, setInkTone] = useState<InkTone>(() => readInitialTone());

  useEffect(() => {
    localStorage.setItem(STORAGE_WIDTH_KEY, String(lineWidth));
  }, [lineWidth]);

  useEffect(() => {
    localStorage.setItem(STORAGE_TONE_KEY, inkTone);
  }, [inkTone]);

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
  }, [lineWidth, inkTone]);

  const applyPenStyle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineWidth = lineWidth;
    context.strokeStyle = inkToneToCss(inkTone);
  }, [inkTone, lineWidth]);

  useEffect(() => {
    applyPenStyle();
  }, [applyPenStyle]);

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
      id='whiteboard-tool'
      className={WhiteboardToolStyles.WhiteboardTool}
    >
      <header className={WhiteboardToolStyles.Topbar}>
        <div className={WhiteboardToolStyles.TopbarLeft}>
          <h2 className={WhiteboardToolStyles.Title}>Whiteboard Tool</h2>
          <p className={WhiteboardToolStyles.Subtitle}>
            Sketch flows, UX ideas, and architecture concepts with a modern
            drawing workspace.
          </p>
        </div>

        <div className={WhiteboardToolStyles.TopbarActions}>
          <button
            className={WhiteboardToolStyles.ActionButton}
            type='button'
            onClick={clearCanvas}
          >
            Clear Board
          </button>
          <button
            className={WhiteboardToolStyles.ActionButton}
            type='button'
            onClick={exportCanvas}
          >
            Export PNG
          </button>
        </div>
      </header>

      <div className={WhiteboardToolStyles.Workspace}>
        <aside className={WhiteboardToolStyles.LeftPanel}>
          <div className={WhiteboardToolStyles.PanelSection}>
            <h3 className={WhiteboardToolStyles.PanelTitle}>Brush</h3>
            <label className={WhiteboardToolStyles.LabelInline}>
              Width
              <input
                className={WhiteboardToolStyles.Range}
                type='range'
                min={1}
                max={8}
                value={lineWidth}
                onChange={(event) => setLineWidth(Number(event.target.value))}
              />
            </label>
            <span className={WhiteboardToolStyles.ValueText}>
              {lineWidth}px
            </span>
          </div>

          <div className={WhiteboardToolStyles.PanelSection}>
            <h3 className={WhiteboardToolStyles.PanelTitle}>Ink Tone</h3>
            <div className={WhiteboardToolStyles.InkGroup}>
              {(['primary', 'highlight', 'text'] as InkTone[]).map((tone) => (
                <button
                  key={tone}
                  className={[
                    WhiteboardToolStyles.InkButton,
                    inkTone === tone
                      ? WhiteboardToolStyles.InkButtonActive
                      : '',
                  ].join(' ')}
                  type='button'
                  onClick={() => setInkTone(tone)}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div className={WhiteboardToolStyles.PanelSection}>
            <h3 className={WhiteboardToolStyles.PanelTitle}>Tips</h3>
            <ul className={WhiteboardToolStyles.Tips}>
              <li>Use short strokes for precision diagram annotations.</li>
              <li>Switch to highlight tone for emphasis areas.</li>
              <li>Export PNG to share with team workflows.</li>
            </ul>
          </div>
        </aside>

        <main className={WhiteboardToolStyles.Stage}>
          <canvas
            ref={canvasRef}
            className={WhiteboardToolStyles.Canvas}
            onPointerDown={beginDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            aria-label='Whiteboard canvas'
          />
        </main>
      </div>
    </Section>
  );
}
