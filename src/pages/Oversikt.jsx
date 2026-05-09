import { useRef, useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
//  CONFIG – justera zoom-gränser här
// ─────────────────────────────────────────────
const MIN_ZOOM = 0.07;   // hur långt man kan zooma ut (1.0 = passar skärmen)
const MAX_ZOOM = 1.0;   // hur långt man kan zooma in
const ZOOM_STEP = 0.15; // steglängd för +/- knappar och scroll

// ─────────────────────────────────────────────
//  IMAGE PATH – byt filnamn vid behov
// ─────────────────────────────────────────────
const IMAGE_SRC = "/src/assets/oversikt.png";

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function getMidpoint(touches) {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

function getPinchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// ─────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────
export default function Oversikt() {
  const containerRef = useRef(null);
  const imgRef       = useRef(null);

  // transform state
  const [zoom, setZoom]   = useState(1);
  const [pos, setPos]     = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  // drag state (refs to avoid stale closures in event handlers)
  const drag     = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const pinch    = useRef({ active: false, startDist: 0, startZoom: 1, midX: 0, midY: 0 });

  // ── fit image to container on load ──────────
  const fitToContainer = useCallback(() => {
    const container = containerRef.current;
    const img       = imgRef.current;
    if (!container || !img) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const fitZoom = Math.min(cw / iw, ch / ih);
    const initZoom = fitZoom * 0.92; // start slightly zoomed out for overview feel

    setZoom(initZoom);
    setPos({
      x: (cw - iw * initZoom) / 2,
      y: (ch - ih * initZoom) / 2,
    });
    setReady(true);
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth) {
      fitToContainer();
    } else {
      img.addEventListener("load", fitToContainer);
      return () => img.removeEventListener("load", fitToContainer);
    }
  }, [fitToContainer]);

  // ── zoom around a point ──────────────────────
  const zoomAround = useCallback((newZoom, pivotX, pivotY) => {
    setZoom((prevZoom) => {
      const clamped = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
      const scale   = clamped / prevZoom;
      setPos((prevPos) => ({
        x: pivotX - scale * (pivotX - prevPos.x),
        y: pivotY - scale * (pivotY - prevPos.y),
      }));
      return clamped;
    });
  }, []);

  // ── wheel zoom ───────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      e.preventDefault();
      const rect  = container.getBoundingClientRect();
      const pivotX = e.clientX - rect.left;
      const pivotY = e.clientY - rect.top;
      const delta  = -e.deltaY * 0.001;
      setZoom((prev) => {
        const newZoom = clamp(prev * (1 + delta * 3), MIN_ZOOM, MAX_ZOOM);
        const scale   = newZoom / prev;
        setPos((p) => ({
          x: pivotX - scale * (pivotX - p.x),
          y: pivotY - scale * (pivotY - p.y),
        }));
        return newZoom;
      });
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  // ── mouse drag ───────────────────────────────
  const onMouseDown = (e) => {
    e.preventDefault();
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!drag.current.active) return;
      setPos({
        x: drag.current.originX + e.clientX - drag.current.startX,
        y: drag.current.originY + e.clientY - drag.current.startY,
      });
    };
    const onMouseUp = () => { drag.current.active = false; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // ── touch: pan + pinch ───────────────────────
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      drag.current = {
        active: true,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        originX: pos.x,
        originY: pos.y,
      };
      pinch.current.active = false;
    } else if (e.touches.length === 2) {
      drag.current.active  = false;
      pinch.current = {
        active: true,
        startDist: getPinchDist(e.touches),
        startZoom: zoom,
        midX: getMidpoint(e.touches).x - containerRef.current.getBoundingClientRect().left,
        midY: getMidpoint(e.touches).y - containerRef.current.getBoundingClientRect().top,
      };
    }
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && drag.current.active) {
      setPos({
        x: drag.current.originX + e.touches[0].clientX - drag.current.startX,
        y: drag.current.originY + e.touches[0].clientY - drag.current.startY,
      });
    } else if (e.touches.length === 2 && pinch.current.active) {
      const dist    = getPinchDist(e.touches);
      const newZoom = clamp(pinch.current.startZoom * (dist / pinch.current.startDist), MIN_ZOOM, MAX_ZOOM);
      const scale   = newZoom / pinch.current.startZoom;
      const { midX, midY, startZoom } = pinch.current;
      setZoom(newZoom);
      setPos((p) => {
        const baseX = midX - scale * (midX - drag.current.originX || p.x);
        const baseY = midY - scale * (midY - drag.current.originY || p.y);
        // recalculate from original pos at pinch start
        return {
          x: midX - (newZoom / startZoom) * (midX - p.x),
          y: midY - (newZoom / startZoom) * (midY - p.y),
        };
      });
    }
  };

  const onTouchEnd = () => {
    drag.current.active  = false;
    pinch.current.active = false;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => container.removeEventListener("touchmove", onTouchMove);
  }, [zoom]);

  // ── button controls ──────────────────────────
  const zoomIn  = () => {
    const c = containerRef.current;
    if (!c) return;
    zoomAround(zoom + ZOOM_STEP, c.clientWidth / 2, c.clientHeight / 2);
  };
  const zoomOut = () => {
    const c = containerRef.current;
    if (!c) return;
    zoomAround(zoom - ZOOM_STEP, c.clientWidth / 2, c.clientHeight / 2);
  };
  const reset   = () => fitToContainer();

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-zinc-900" style={{ height: "calc(100vh)" }}>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{ cursor: drag.current.active ? "grabbing" : "grab", touchAction: "none" }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Image */}
        <img
          ref={imgRef}
          src={IMAGE_SRC}
          alt="Översikt"
          draggable={false}
          className="absolute select-none"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            opacity: ready ? 1 : 0,
            transition: ready ? "none" : "opacity 0.3s",
            maxWidth: "none",
          }}
        />

        {/* Loading spinner */}
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 py-3 bg-zinc-900 border-t border-zinc-800">
        <button
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-lg font-light select-none"
          aria-label="Zooma ut"
        >
          −
        </button>

        <button
          onClick={reset}
          className="px-3 h-9 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition text-xs font-medium tabular-nums min-w-[4rem] select-none"
          aria-label="Återställ zoom"
        >
          {Math.round(zoom * 100)} %
        </button>

        <button
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-lg font-light select-none"
          aria-label="Zooma in"
        >
          +
        </button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        <button
          onClick={reset}
          className="h-9 px-3 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition text-xs select-none"
          aria-label="Återställ"
        >
          Återställ
        </button>
      </div>
    </div>
  );
}
