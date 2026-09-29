import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import TimeUnitBox from './TimeUnitBox';
import { WeekStatus, TimeUnit } from '../types';

interface CalendarGridProps {
  totalElapsed: number;
  lifeExpectancy: number;
  timeUnit: TimeUnit;
  isPrintVersion?: boolean;
}

const getGridConfig = (timeUnit: TimeUnit, lifeExpectancy: number) => {
  switch (timeUnit) {
    case 'Months':
      return { total: Math.ceil(lifeExpectancy * 12), cols: 12, unitName: 'Month', xInterval: 1 };
    case 'Years':
      return { total: Math.ceil(lifeExpectancy), cols: 10, unitName: 'Year', xInterval: 1 };
    case 'Weeks':
    default:
      return { total: Math.ceil(lifeExpectancy * 52.1775), cols: 52, unitName: 'Week', xInterval: 5 };
  }
};

// Cell size per zoom level (Weeks mode). Other units always use 'normal'.
const ZOOM_CONFIG = {
  compact: { cellSize: 5, gap: 1 },
  normal:  { cellSize: 8, gap: 2 },
  large:   { cellSize: 12, gap: 3 },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DOM-based grid — used ONLY for print / html2canvas export (isPrintVersion=true)
// Keeps the original implementation so html2canvas and native @media print work.
// ─────────────────────────────────────────────────────────────────────────────
const DOMCalendarGrid: React.FC<{
  totalElapsed: number;
  lifeExpectancy: number;
  timeUnit: TimeUnit;
}> = ({ totalElapsed, lifeExpectancy, timeUnit }) => {
  const { total, cols, unitName, xInterval } = getGridConfig(timeUnit, lifeExpectancy);
  const totalRows = Math.ceil(total / cols);
  const gridStartColumn = 3;

  const expectancyTotal = Math.floor(
    lifeExpectancy * (timeUnit === 'Weeks' ? 52.1775 : timeUnit === 'Months' ? 12 : 1)
  );

  const yAxisLabels = useMemo(() => {
    const labels = [];
    const step = timeUnit === 'Years' ? 1 : 5;
    for (let i = 0; i < totalRows; i++) {
      if (i === 0 || i % step === 0) {
        labels.push(
          <div
            key={`y-${i}`}
            style={{ gridRow: i + 3, gridColumn: 2 }}
            className="text-right text-[10px] text-muted-foreground font-mono pr-2 pt-0.5 select-none"
          >
            {timeUnit === 'Years' ? `${i * 10}` : `${i}`}
          </div>
        );
      }
    }
    return labels;
  }, [totalRows, timeUnit]);

  const xAxisLabels = useMemo(() => {
    const labels = [];
    for (let i = 1; i <= cols; i++) {
      if (i === 1 || i % xInterval === 0 || i === cols) {
        labels.push(
          <div
            key={`x-${i}`}
            style={{ gridColumn: i + gridStartColumn - 1, gridRow: 2 }}
            className="text-center text-[10px] text-muted-foreground font-mono pb-1 select-none"
          >
            {i}
          </div>
        );
      }
    }
    return labels;
  }, [cols, xInterval]);

  const gridElements = useMemo(() => {
    const grid = [];
    for (let i = 0; i < total; i++) {
      let status: WeekStatus;
      if (i < totalElapsed) status = WeekStatus.Past;
      else if (i === totalElapsed) status = WeekStatus.Present;
      else status = WeekStatus.Future;

      const row = Math.floor(i / cols) + 3;
      const col = (i % cols) + gridStartColumn;
      const currentAge =
        timeUnit === 'Weeks' ? Math.floor(i / 52) : timeUnit === 'Months' ? Math.floor(i / 12) : i;

      grid.push(
        <div key={i} style={{ gridRow: row, gridColumn: col }} className="flex items-center justify-center">
          <TimeUnitBox
            status={status}
            isBeyondLifeExpectancy={i >= expectancyTotal}
            tooltip={`${unitName} ${i + 1} (Age ${currentAge})`}
            isPrintVersion={true}
          />
        </div>
      );
    }
    return grid;
  }, [total, totalElapsed, cols, lifeExpectancy, timeUnit, unitName, expectancyTotal]);

  return (
    <div className={`w-full p-1 overflow-visible`}>
      <div
        className={`w-full grid ${timeUnit === 'Weeks' ? 'gap-[1.5px]' : 'gap-1'} items-start`}
        style={{
          gridTemplateColumns: `auto auto repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `auto auto repeat(${totalRows}, minmax(0, 1fr))`,
        }}
      >
        {/* Y Axis Title */}
        <div
          style={{ gridColumn: 1, gridRow: `3 / span ${totalRows}` }}
          className="flex items-center justify-center [writing-mode:vertical-rl] rotate-180 self-center select-none py-2"
        >
          <span className="text-[11px] font-bold text-foreground/80 tracking-wider">
            {timeUnit === 'Years' ? 'Decade' : 'Age'}
          </span>
        </div>
        {/* X Axis Title */}
        <div
          style={{ gridColumn: `${gridStartColumn} / span ${cols}`, gridRow: 1 }}
          className="text-center py-1 select-none"
        >
          <span className="text-xs font-bold text-foreground/90 tracking-wider">{unitName} of Year</span>
        </div>
        {xAxisLabels}
        {yAxisLabels}
        {gridElements}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Canvas-based grid — used for all on-screen rendering.
// Replaces ~4,176 DOM nodes with a single <canvas> element.
// Re-draws only when props or hover state changes — no continuous RAF loop.
// ─────────────────────────────────────────────────────────────────────────────
const CanvasCalendarGrid: React.FC<{
  totalElapsed: number;
  lifeExpectancy: number;
  timeUnit: TimeUnit;
  zoom: 'compact' | 'normal' | 'large';
}> = ({ totalElapsed, lifeExpectancy, timeUnit, zoom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  // Track theme so we redraw when light↔dark switches
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const { total, cols, unitName, xInterval } = getGridConfig(timeUnit, lifeExpectancy);
  const totalRows = Math.ceil(total / cols);
  const { cellSize, gap } = ZOOM_CONFIG[zoom];

  const canvasW = cols * (cellSize + gap) - gap;
  const canvasH = totalRows * (cellSize + gap) - gap;

  const expectancyTotal = useMemo(
    () => Math.floor(lifeExpectancy * (timeUnit === 'Weeks' ? 52.1775 : timeUnit === 'Months' ? 12 : 1)),
    [lifeExpectancy, timeUnit]
  );

  // Detect theme class changes on <html>
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // ── Draw all cells on canvas ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Read live CSS custom properties (works for both light and dark theme)
    const cs = getComputedStyle(document.documentElement);
    const v = (name: string) => cs.getPropertyValue(name).trim();
    const accent        = v('--accent');        // "221 83% 53%"
    const accentPresent = v('--accent-present');
    const muted         = v('--muted');
    const border        = v('--border');

    const colorPast        = `hsl(${accent})`;
    const colorPresent     = `hsl(${accentPresent})`;
    const colorFuture      = `hsl(${muted} / 0.4)`;
    const colorBeyond      = `hsl(${muted} / 0.18)`;
    const colorHoverPast   = `hsl(${accent} / 0.72)`;
    const colorHoverFuture = `hsl(${muted} / 0.72)`;
    const colorBorder      = `hsl(${border} / 0.6)`;

    const r = Math.max(1, Math.round(cellSize * 0.22)); // corner radius

    for (let i = 0; i < total; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * (cellSize + gap);
      const y = row * (cellSize + gap);
      const isHover  = i === hoveredIdx;
      const isBeyond = i >= expectancyTotal;

      let color: string;
      if (i < totalElapsed)      color = isHover ? colorHoverPast   : colorPast;
      else if (i === totalElapsed) color = colorPresent; // CSS pulse overlay on top
      else if (isBeyond)         color = colorBeyond;
      else                       color = isHover ? colorHoverFuture : colorFuture;

      ctx.fillStyle = color;
      if (r > 0 && (ctx as any).roundRect) {
        ctx.beginPath();
        (ctx as any).roundRect(x, y, cellSize, cellSize, r);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, cellSize, cellSize);
      }

      // Draw a subtle border for future / beyond cells
      if (i >= totalElapsed && i !== totalElapsed) {
        ctx.strokeStyle = colorBorder;
        ctx.lineWidth = 0.5;
        if (r > 0 && (ctx as any).roundRect) {
          ctx.beginPath();
          (ctx as any).roundRect(x + 0.25, y + 0.25, cellSize - 0.5, cellSize - 0.5, r);
          ctx.stroke();
        } else {
          ctx.strokeRect(x + 0.25, y + 0.25, cellSize - 0.5, cellSize - 0.5);
        }
      }
    }
  }, [total, totalElapsed, cols, cellSize, gap, canvasW, canvasH, expectancyTotal, hoveredIdx, isDark]);

  // ── Present-cell pulse overlay (CSS animation, no RAF needed) ────────────
  const presentPos = useMemo(() => {
    if (totalElapsed < 0 || totalElapsed >= total) return null;
    return {
      left: (totalElapsed % cols) * (cellSize + gap),
      top: Math.floor(totalElapsed / cols) * (cellSize + gap),
    };
  }, [totalElapsed, cols, cellSize, gap, total]);

  // ── Mouse interaction ─────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const col = Math.floor(mx / (cellSize + gap));
      const row = Math.floor(my / (cellSize + gap));
      if (col < 0 || col >= cols || row < 0 || row >= totalRows) {
        setHoveredIdx(null); setTooltip(null); return;
      }
      // Reject if inside the gap between cells
      if (mx - col * (cellSize + gap) > cellSize || my - row * (cellSize + gap) > cellSize) {
        setHoveredIdx(null); setTooltip(null); return;
      }
      const idx = row * cols + col;
      if (idx >= total) { setHoveredIdx(null); setTooltip(null); return; }

      const age = timeUnit === 'Weeks' ? Math.floor(idx / 52) : timeUnit === 'Months' ? Math.floor(idx / 12) : idx;
      setHoveredIdx(idx);
      setTooltip({ text: `${unitName} ${idx + 1} (Age ${age})`, x: mx, y: my });
    },
    [cols, totalRows, cellSize, gap, total, timeUnit, unitName]
  );

  const handleMouseLeave = useCallback(() => { setHoveredIdx(null); setTooltip(null); }, []);

  // ── Axis label data (memoized; tiny arrays, not 4K) ───────────────────────
  const yLabels = useMemo(() => {
    const out: { label: string; top: number }[] = [];
    const step = timeUnit === 'Years' ? 1 : 5;
    for (let i = 0; i < totalRows; i++) {
      if (i === 0 || i % step === 0)
        out.push({ label: timeUnit === 'Years' ? `${i * 10}` : `${i}`, top: i * (cellSize + gap) });
    }
    return out;
  }, [totalRows, timeUnit, cellSize, gap]);

  const xLabels = useMemo(() => {
    const out: { label: string; left: number }[] = [];
    for (let i = 1; i <= cols; i++) {
      if (i === 1 || i % xInterval === 0 || i === cols)
        out.push({ label: `${i}`, left: (i - 1) * (cellSize + gap) });
    }
    return out;
  }, [cols, xInterval, cellSize, gap]);

  const Y_TITLE_W = 16;
  const Y_LABEL_W = 28;
  const X_TITLE_H = 22;
  const X_LABEL_H = 18;

  return (
    <div className="w-full overflow-x-auto scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex items-start" style={{ minWidth: canvasW + Y_TITLE_W + Y_LABEL_W + 4 }}>

        {/* Y-axis title (rotated) */}
        <div
          className="flex-shrink-0 flex items-center justify-center [writing-mode:vertical-rl] rotate-180 select-none"
          style={{ width: Y_TITLE_W, height: canvasH, marginTop: X_TITLE_H + X_LABEL_H }}
        >
          <span className="text-[11px] sm:text-xs font-bold text-foreground/80 tracking-wider">
            {timeUnit === 'Years' ? 'Decade' : 'Age'}
          </span>
        </div>

        {/* Y-axis number labels */}
        <div
          className="relative flex-shrink-0"
          style={{ width: Y_LABEL_W, height: canvasH, marginTop: X_TITLE_H + X_LABEL_H }}
        >
          {yLabels.map(({ label, top }) => (
            <div
              key={label}
              className="absolute right-2 text-[10px] sm:text-xs text-muted-foreground font-mono select-none leading-none"
              style={{ top }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Canvas column */}
        <div className="flex-shrink-0">
          {/* X-axis title */}
          <div className="text-center select-none" style={{ height: X_TITLE_H, width: canvasW }}>
            <span className="text-xs sm:text-sm font-bold text-foreground/90 tracking-wider">
              {unitName} of Year
            </span>
          </div>

          {/* X-axis number labels */}
          <div className="relative" style={{ height: X_LABEL_H, width: canvasW }}>
            {xLabels.map(({ label, left }) => (
              <div
                key={label}
                className="absolute text-[10px] sm:text-xs text-muted-foreground font-mono select-none text-center leading-none"
                style={{ left, width: cellSize }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Canvas + overlays */}
          <div className="relative" style={{ width: canvasW, height: canvasH }}>
            <canvas
              ref={canvasRef}
              style={{
                width: canvasW,
                height: canvasH,
                display: 'block',
                cursor: 'crosshair',
                // Let touch events pass through for native scroll — mouse hover still works
                touchAction: 'pan-x pan-y',
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Present-cell pulse — 1 tiny div, CSS animation, no RAF */}
            {presentPos && (
              <div
                className="absolute pointer-events-none animate-pulse bg-accent-present rounded-sm ring-2 ring-accent-present/50 z-10"
                style={{
                  left: presentPos.left,
                  top: presentPos.top,
                  width: cellSize,
                  height: cellSize,
                }}
              />
            )}

            {/* Tooltip */}
            {tooltip && hoveredIdx !== null && hoveredIdx !== totalElapsed && (
              <div
                className="absolute pointer-events-none z-30 whitespace-nowrap px-2 py-1 bg-card/95 backdrop-blur-sm border border-border text-card-foreground text-[11px] font-medium rounded shadow-md hidden sm:block"
                style={{
                  left: Math.max(0, Math.min(tooltip.x - 36, canvasW - 160)),
                  top: tooltip.y > 36 ? tooltip.y - 34 : tooltip.y + cellSize + 4,
                }}
              >
                {tooltip.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Public component — routes to canvas (screen) or DOM (print/export)
// ─────────────────────────────────────────────────────────────────────────────
const CalendarGrid: React.FC<CalendarGridProps> = ({
  totalElapsed,
  lifeExpectancy,
  timeUnit,
  isPrintVersion = false,
}) => {
  const [zoom, setZoom] = useState<'compact' | 'normal' | 'large'>('normal');

  const { total } = getGridConfig(timeUnit, lifeExpectancy);
  const remaining = Math.max(0, total - totalElapsed);

  // Print / export path — keep DOM rendering for html2canvas + @media print
  if (isPrintVersion) {
    return (
      <DOMCalendarGrid
        totalElapsed={totalElapsed}
        lifeExpectancy={lifeExpectancy}
        timeUnit={timeUnit}
      />
    );
  }

  // Screen path — single <canvas> element
  return (
    <div className="w-full p-3 sm:p-5">
      {/* Legend + zoom controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-border/60">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-accent border border-accent/60 inline-block" />
            <span>Past ({totalElapsed.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-accent-present border border-accent-present animate-pulse inline-block" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-muted/40 border border-border inline-block" />
            <span>Remaining ({remaining.toLocaleString()})</span>
          </div>
        </div>

        {timeUnit === 'Weeks' && (
          <div className="flex items-center gap-1 bg-background/80 border border-border rounded-lg p-0.5 text-xs">
            <span className="text-muted-foreground px-2 py-0.5 text-[11px] hidden sm:inline">Density:</span>
            {(['compact', 'normal', 'large'] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoom(z)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  zoom === z
                    ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {z === 'compact' ? 'Compact' : z === 'normal' ? 'Standard' : 'Comfortable'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile scroll hint */}
      {timeUnit === 'Weeks' && (
        <div className="sm:hidden text-center text-[11px] text-muted-foreground/80 mb-2 flex items-center justify-center gap-1">
          <span>⇄ Swipe horizontally to see all 52 weeks</span>
        </div>
      )}

      <CanvasCalendarGrid
        totalElapsed={totalElapsed}
        lifeExpectancy={lifeExpectancy}
        timeUnit={timeUnit}
        zoom={timeUnit !== 'Weeks' ? 'normal' : zoom}
      />
    </div>
  );
};

export default CalendarGrid;
