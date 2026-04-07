import React, { useEffect, useRef, useState } from "react";

const SignaturePadCanvas = ({ onChange, disabled = false, className = "" }) => {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const point = event.touches?.[0] || event;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
    };
  };

  const drawStart = (event) => {
    if (disabled) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const point = getPoint(event);
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const drawMove = (event) => {
    if (!drawingRef.current || disabled) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const point = getPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    if (!hasStroke) setHasStroke(true);
  };

  const drawEnd = () => {
    if (disabled) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (onChange) onChange(dataUrl, hasStroke);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    if (onChange) onChange("", false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <canvas
          ref={canvasRef}
          width={700}
          height={220}
          className="w-full touch-none bg-white"
          onMouseDown={drawStart}
          onMouseMove={drawMove}
          onMouseUp={drawEnd}
          onMouseLeave={drawEnd}
          onTouchStart={drawStart}
          onTouchMove={drawMove}
          onTouchEnd={drawEnd}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Sign with mouse, touch, or pen device.</p>
        <button
          type="button"
          onClick={clear}
          disabled={disabled}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default SignaturePadCanvas;
