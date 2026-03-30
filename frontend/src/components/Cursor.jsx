import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

const TRAIL_LENGTH = 20;
const TRAIL_FADE_SPEED = 0.92;

export default function Cursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringOptions, setIsHoveringOptions] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const canvasRef = useRef(null);
  const trailRef = useRef([]);
  const animFrameRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Trail rendering loop
  const renderTrail = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // Resize if needed
    if (canvas.width !== window.innerWidth * dpr || canvas.height !== window.innerHeight * dpr) {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Add current mouse position to trail
    const { x, y } = mouseRef.current;
    trailRef.current.unshift({ x, y, opacity: 0.6 });

    // Trim trail
    if (trailRef.current.length > TRAIL_LENGTH) {
      trailRef.current = trailRef.current.slice(0, TRAIL_LENGTH);
    }

    // Draw trail dots
    for (let i = 0; i < trailRef.current.length; i++) {
      const point = trailRef.current[i];
      point.opacity *= TRAIL_FADE_SPEED;

      if (point.opacity < 0.01) continue;

      const progress = i / trailRef.current.length;
      const size = Math.max(1, (1 - progress) * 3.5);

      // Cyan-ish glow matching the accent color
      const hue = 195 + progress * 25;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 85%, 60%, ${point.opacity})`;
      ctx.fill();

      // Outer glow
      if (i < 6) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 85%, 60%, ${point.opacity * 0.15})`;
        ctx.fill();
      }
    }

    animFrameRef.current = requestAnimationFrame(renderTrail);
  }, []);

  useEffect(() => {
    const updateMousePosition = (e) => {
      const pos = { x: e.clientX, y: e.clientY };
      setMousePosition(pos);
      mouseRef.current = pos;
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    const handleMouseOver = (e) => {
      if (
        e.target.tagName.toLowerCase() === "button" ||
        e.target.tagName.toLowerCase() === "a" ||
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.tagName.toLowerCase() === "input" ||
        e.target.tagName.toLowerCase() === "textarea"
      ) {
        setIsHoveringOptions(true);
      } else {
        setIsHoveringOptions(false);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // Start trail rendering
    animFrameRef.current = requestAnimationFrame(renderTrail);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderTrail]);

  return (
    <>
      {/* Trail canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 9997,
        }}
      />
      {/* Main cursor ring */}
      <motion.div
        className="custom-cursor"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isClicked ? 0.8 : isHoveringOptions ? 1.4 : 1,
          opacity: 1,
        }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: "50%",
          backgroundColor: isHoveringOptions
            ? "transparent"
            : "var(--text-primary)",
          border: isHoveringOptions
            ? "1.5px solid var(--text-primary)"
            : "none",
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode: "difference",
        }}
      />
      {/* Center dot */}
      <motion.div
        className="custom-cursor-dot"
        animate={{
          x: mousePosition.x - 3,
          y: mousePosition.y - 3,
          scale: isClicked ? 0.5 : 1,
          opacity: isHoveringOptions ? 0 : 1,
        }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: "var(--bg-base)",
          pointerEvents: "none",
          zIndex: 10000,
          mixBlendMode: "difference",
        }}
      />
    </>
  );
}
