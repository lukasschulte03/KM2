import { useRef, useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
//  CONFIG – justera zoom-gränser här
// ─────────────────────────────────────────────
const MIN_ZOOM  = 0.07;   // hur långt man kan zooma ut (1.0 = passar skärmen)
const MAX_ZOOM  = 1.0;   // hur långt man kan zooma in
const ZOOM_STEP = 0.15;  // steglängd för +/- knappar och scroll

// ─────────────────────────────────────────────
//  IMAGE PATH – byt filnamn vid behov
// ─────────────────────────────────────────────
const IMAGE_SRC = "/oversikt.png";

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function getPinchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPinchMid(touches, rect) {
	return {
		x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
		y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top,
	};
}

// ─────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────
export default function Oversikt() {
  const containerRef = useRef(null);
  const imgRef       = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  // Mirror of zoom+pos as a ref so touch handlers (registered once) always
  // see the latest values without stale closure issues.
  const stateRef = useRef({ zoom: 1, pos: { x: 0, y: 0 } });
  useEffect(() => {
		stateRef.current = { zoom, pos };
  }, [zoom, pos]);

  const drag = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  // Pinch stores a full snapshot at the moment two fingers land.
  const pinch = useRef({ active: false, startDist: 0, startZoom: 1, midX: 0, midY: 0, originX: 0, originY: 0 });

  // ── fit image to container ───────────────────
  const fitToContainer = useCallback(() => {
		const container = containerRef.current;
		const img = imgRef.current;
		if (!container || !img) return;
		const cw = container.clientWidth;
		const ch = container.clientHeight;
		const iw = img.naturalWidth;
		const ih = img.naturalHeight;
		const fitZoom = Math.min(cw / iw, ch / ih);
		const initZoom = fitZoom * 0.92;
		const initPos = {
			x: (cw - iw * initZoom) / 2,
			y: (ch - ih * initZoom) / 2,
		};
		setZoom(initZoom);
		setPos(initPos);
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

  // ── wheel zoom ───────────────────────────────
  useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const onWheel = (e) => {
			e.preventDefault();
			const rect = container.getBoundingClientRect();
			const pivotX = e.clientX - rect.left;
			const pivotY = e.clientY - rect.top;
			const { zoom: prevZoom, pos: prevPos } = stateRef.current;
			const newZoom = clamp(prevZoom * (1 - e.deltaY * 0.001 * 3), MIN_ZOOM, MAX_ZOOM);
			const scale = newZoom / prevZoom;
			setZoom(newZoom);
			setPos({
				x: pivotX - scale * (pivotX - prevPos.x),
				y: pivotY - scale * (pivotY - prevPos.y),
			});
		};
		container.addEventListener("wheel", onWheel, { passive: false });
		return () => container.removeEventListener("wheel", onWheel);
  }, []);

  // ── mouse drag ───────────────────────────────
  const onMouseDown = (e) => {
		e.preventDefault();
		const { pos: p } = stateRef.current;
		drag.current = { active: true, startX: e.clientX, startY: e.clientY, originX: p.x, originY: p.y };
  };

  useEffect(() => {
		const onMouseMove = (e) => {
			if (!drag.current.active) return;
			setPos({
				x: drag.current.originX + e.clientX - drag.current.startX,
				y: drag.current.originY + e.clientY - drag.current.startY,
			});
		};
		const onMouseUp = () => {
			drag.current.active = false;
		};
		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
		return () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};
  }, []);

  // ── touch (registered once via useEffect) ────
  useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const onTouchStart = (e) => {
			const { zoom: curZoom, pos: curPos } = stateRef.current;

			if (e.touches.length === 1) {
				pinch.current.active = false;
				drag.current = {
					active: true,
					startX: e.touches[0].clientX,
					startY: e.touches[0].clientY,
					originX: curPos.x,
					originY: curPos.y,
				};
			} else if (e.touches.length === 2) {
				drag.current.active = false;
				const rect = container.getBoundingClientRect();
				const mid = getPinchMid(e.touches, rect);
				pinch.current = {
					active: true,
					startDist: getPinchDist(e.touches),
					startZoom: curZoom,
					midX: mid.x,
					midY: mid.y,
					originX: curPos.x, // snapshot – never updated during this pinch
					originY: curPos.y,
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
				const { startDist, startZoom, midX, midY, originX, originY } = pinch.current;
				const newZoom = clamp(startZoom * (getPinchDist(e.touches) / startDist), MIN_ZOOM, MAX_ZOOM);
				const scale = newZoom / startZoom;
				// Compute position purely from the pinch-start snapshot → no stale state
				setZoom(newZoom);
				setPos({
					x: midX - scale * (midX - originX),
					y: midY - scale * (midY - originY),
				});
			}
		};

		const onTouchEnd = (e) => {
			if (e.touches.length < 2) pinch.current.active = false;
			if (e.touches.length < 1) drag.current.active = false;

			// One finger remains after pinch → restart drag from current position
			if (e.touches.length === 1) {
				const { pos: curPos } = stateRef.current;
				drag.current = {
					active: true,
					startX: e.touches[0].clientX,
					startY: e.touches[0].clientY,
					originX: curPos.x,
					originY: curPos.y,
				};
			}
		};

		container.addEventListener("touchstart", onTouchStart, { passive: true });
		container.addEventListener("touchmove", onTouchMove, { passive: false });
		container.addEventListener("touchend", onTouchEnd, { passive: true });
		return () => {
			container.removeEventListener("touchstart", onTouchStart);
			container.removeEventListener("touchmove", onTouchMove);
			container.removeEventListener("touchend", onTouchEnd);
		};
  }, []); // empty deps – stateRef always holds current values

  // ── button controls ──────────────────────────
  const zoomAround = (delta) => {
		const container = containerRef.current;
		if (!container) return;
		const { zoom: curZoom, pos: curPos } = stateRef.current;
		const pivotX = container.clientWidth / 2;
		const pivotY = container.clientHeight / 2;
		const newZoom = clamp(curZoom + delta, MIN_ZOOM, MAX_ZOOM);
		const scale = newZoom / curZoom;
		setZoom(newZoom);
		setPos({
			x: pivotX - scale * (pivotX - curPos.x),
			y: pivotY - scale * (pivotY - curPos.y),
		});
  };

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
		<div className="flex flex-col bg-zinc-900" style={{ height: "calc(100vh - 49px)" }}>
			{/* Canvas */}
			<div
				ref={containerRef}
				className="flex-1 overflow-hidden relative"
				style={{ cursor: drag.current.active ? "grabbing" : "grab", touchAction: "none" }}
				onMouseDown={onMouseDown}>
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

				{!ready && (
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
					</div>
				)}
			</div>

			{/* Controls */}
			<div className="flex items-center justify-center gap-2 py-3 bg-zinc-900 border-t border-zinc-800">
				<button
					onClick={() => zoomAround(-ZOOM_STEP)}
					disabled={zoom <= MIN_ZOOM}
					className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-lg font-light select-none"
					aria-label="Zooma ut">
					−
				</button>

				<button
					onClick={fitToContainer}
					className="px-3 h-9 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition text-xs font-medium tabular-nums min-w-[4rem] select-none"
					aria-label="Återställ zoom">
					{Math.round(zoom * 100)} %
				</button>

				<button
					onClick={() => zoomAround(ZOOM_STEP)}
					disabled={zoom >= MAX_ZOOM}
					className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-lg font-light select-none"
					aria-label="Zooma in">
					+
				</button>

				<div className="w-px h-5 bg-zinc-700 mx-1" />

				<button
					onClick={fitToContainer}
					className="h-9 px-3 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition text-xs select-none"
					aria-label="Återställ">
					Återställ
				</button>
			</div>
		</div>
  );
}
