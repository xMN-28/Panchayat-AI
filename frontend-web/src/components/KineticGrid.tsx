import { type ReactNode, useCallback, useEffect, useRef } from "react";

type Point = { x: number; y: number };
type Ripple = Point & { radius: number; opacity: number; born: number };

const CELL_SIZE = 55;
const INFLUENCE_RADIUS = 260;
const MAX_WARP = 24;
const DOT_SPACING = 28;
const LERP_SPEED = 0.08;
const LINE_BASE = { r: 255, g: 239, b: 218, a: 0.11 };
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const rgba = (from: typeof LINE_BASE, to: typeof LINE_BASE, amount: number) => `rgba(${Math.round(lerp(from.r, to.r, amount))},${Math.round(lerp(from.g, to.g, amount))},${Math.round(lerp(from.b, to.b, amount))},${lerp(from.a, to.a, amount).toFixed(3)})`;

export default function KineticGrid({ children, className = "" }: { children?: ReactNode; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<Point>({ x: -9999, y: -9999 });
  const target = useRef<Point>({ x: -9999, y: -9999 });
  const ripples = useRef<Ripple[]>([]);
  const size = useRef({ width: 0, height: 0, ratio: 1 });
  const frame = useRef(0);

  const warpPoint = useCallback((x: number, y: number, column: number, row: number, columns: number, rows: number) => {
    const edgeMargin = 1.5;
    const columnPin = Math.min(column / edgeMargin, (columns - 1 - column) / edgeMargin, 1);
    const rowPin = Math.min(row / edgeMargin, (rows - 1 - row) / edgeMargin, 1);
    const pin = Math.max(0, columnPin * columnPin * rowPin * rowPin);
    const dx = x - pointer.current.x;
    const dy = y - pointer.current.y;
    const distance = Math.hypot(dx, dy);
    const proximity = Math.max(0, 1 - distance / INFLUENCE_RADIUS) * pin;
    let rippleX = 0;
    let rippleY = 0;
    for (const ripple of ripples.current) {
      const rippleDx = x - ripple.x;
      const rippleDy = y - ripple.y;
      const rippleDistance = Math.hypot(rippleDx, rippleDy);
      const difference = rippleDistance - ripple.radius;
      if (Math.abs(difference) < 55 && rippleDistance > 0) {
        const strength = (1 - Math.abs(difference) / 55) * ripple.opacity * 18 * pin;
        const direction = difference < 0 ? 1 : -1;
        rippleX += (rippleDx / rippleDistance) * strength * direction;
        rippleY += (rippleDy / rippleDistance) * strength * direction;
      }
    }
    if (distance < INFLUENCE_RADIUS && distance > 0 && pin > 0) {
      const normalized = distance / INFLUENCE_RADIUS;
      const eased = normalized < 0.01 ? 0 : (1 - normalized) ** 2 * Math.min(1, distance / 60);
      const amount = eased * MAX_WARP * pin;
      return { point: { x: x - (dx / distance) * amount + rippleX, y: y - (dy / distance) * amount + rippleY }, proximity };
    }
    return { point: { x: x + rippleX, y: y + rippleY }, proximity };
  }, []);

  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const { width, height, ratio } = size.current;
    pointer.current.x = lerp(pointer.current.x, target.current.x, LERP_SPEED);
    pointer.current.y = lerp(pointer.current.y, target.current.y, LERP_SPEED);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const background = context.createRadialGradient(width * 0.5, height * 0.43, 0, width * 0.5, height * 0.43, Math.max(width, height) * 0.72);
    background.addColorStop(0, "#51243f"); background.addColorStop(0.48, "#351a34"); background.addColorStop(1, "#1d111d");
    context.fillStyle = background; context.fillRect(0, 0, width, height);
    context.fillStyle = "rgba(255,239,218,.045)";
    for (let x = DOT_SPACING / 2; x < width; x += DOT_SPACING) for (let y = DOT_SPACING / 2; y < height; y += DOT_SPACING) { context.beginPath(); context.arc(x, y, 0.7, 0, Math.PI * 2); context.fill(); }
    for (let index = ripples.current.length - 1; index >= 0; index -= 1) {
      const ripple = ripples.current[index]; const age = (now - ripple.born) / 1000;
      ripple.radius = Math.max(0, age * 400); ripple.opacity = Math.max(0, 1 - age * 1.2);
      if (ripple.opacity <= 0) ripples.current.splice(index, 1);
    }
    const columns = Math.max(2, Math.ceil(width / CELL_SIZE)) + 1;
    const rows = Math.max(2, Math.ceil(height / CELL_SIZE)) + 1;
    const cellWidth = width / (columns - 1); const cellHeight = height / (rows - 1);
    const points: Point[][] = []; const proximity: number[][] = [];
    for (let row = 0; row < rows; row += 1) {
      points[row] = []; proximity[row] = [];
      for (let column = 0; column < columns; column += 1) {
        const warped = warpPoint(column * cellWidth, row * cellHeight, column, row, columns, rows);
        points[row][column] = warped.point; proximity[row][column] = warped.proximity;
      }
    }
    const activeLine = { r: 255, g: 189, b: 89, a: 0.82 };
    const drawSegment = (from: Point, to: Point, fromProximity: number, toProximity: number) => {
      const average = (fromProximity + toProximity) / 2; const smooth = average * average * (3 - 2 * average);
      context.beginPath(); context.moveTo(from.x, from.y); context.lineTo(to.x, to.y);
      context.strokeStyle = rgba(LINE_BASE, activeLine, smooth); context.lineWidth = lerp(0.7, 1.45, smooth); context.stroke();
    };
    for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns - 1; column += 1) drawSegment(points[row][column], points[row][column + 1], proximity[row][column], proximity[row][column + 1]);
    for (let column = 0; column < columns; column += 1) for (let row = 0; row < rows - 1; row += 1) drawSegment(points[row][column], points[row + 1][column], proximity[row][column], proximity[row + 1][column]);
    for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
      const point = points[row][column]; const amount = proximity[row][column] ** 2 * (3 - 2 * proximity[row][column]);
      if (amount > 0.25) { const glow = context.createRadialGradient(point.x, point.y, 1, point.x, point.y, 10); glow.addColorStop(0, `rgba(255,189,89,${amount * 0.36})`); glow.addColorStop(1, "rgba(255,189,89,0)"); context.fillStyle = glow; context.beginPath(); context.arc(point.x, point.y, 10, 0, Math.PI * 2); context.fill(); }
      context.fillStyle = rgba({ r: 255, g: 239, b: 218, a: 0.18 }, { r: 255, g: 189, b: 89, a: 1 }, amount);
      context.beginPath(); context.arc(point.x, point.y, lerp(1.5, 3.2, amount), 0, Math.PI * 2); context.fill();
    }
    for (const ripple of ripples.current) { context.beginPath(); context.arc(ripple.x, ripple.y, Math.max(0, ripple.radius), 0, Math.PI * 2); context.strokeStyle = `rgba(255,189,89,${(ripple.opacity * 0.38).toFixed(3)})`; context.lineWidth = 1.5; context.stroke(); }
    frame.current = requestAnimationFrame(draw);
  }, [warpPoint]);

  useEffect(() => {
    const root = rootRef.current; const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const resize = () => { const bounds = root.getBoundingClientRect(); const ratio = Math.min(window.devicePixelRatio || 1, 2); size.current = { width: bounds.width, height: bounds.height, ratio }; canvas.width = Math.max(1, Math.round(bounds.width * ratio)); canvas.height = Math.max(1, Math.round(bounds.height * ratio)); };
    const coordinates = (event: PointerEvent) => { const bounds = root.getBoundingClientRect(); return { x: event.clientX - bounds.left, y: event.clientY - bounds.top, inside: event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom }; };
    const move = (event: PointerEvent) => {
      const point = coordinates(event);
      if (point.inside) target.current = point;
      else { target.current = { x: -9999, y: -9999 }; pointer.current = { x: -9999, y: -9999 }; }
    };
    const click = (event: PointerEvent) => { const point = coordinates(event); if (point.inside) ripples.current.push({ x: point.x, y: point.y, radius: 0, opacity: 1, born: performance.now() }); };
    const observer = new ResizeObserver(resize);
    resize(); observer.observe(root); window.addEventListener("pointermove", move, { passive: true }); window.addEventListener("pointerdown", click, { passive: true }); frame.current = requestAnimationFrame(draw);
    return () => { observer.disconnect(); window.removeEventListener("pointermove", move); window.removeEventListener("pointerdown", click); cancelAnimationFrame(frame.current); };
  }, [draw]);

  return <div ref={rootRef} className={`kinetic-grid ${className}`}><canvas ref={canvasRef} aria-hidden="true" /><div className="kinetic-content">{children}</div></div>;
}
