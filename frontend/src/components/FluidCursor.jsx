import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import useFluidCursor from "../hooks/useFluidCursor";

export default function FluidCursor() {
  const canvasRef = useRef(null);
  const dotRef = useRef(null);
  const initialized = useRef(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    if (!initialized.current && canvasRef.current) {
      initialized.current = true;
      requestAnimationFrame(() => {
        useFluidCursor();
      });
    }

    const onMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (dotRef.current) {
        // Direct DOM manipulation for zero-latency tracking
        dotRef.current.style.transform = `translate3d(${e.clientX - 6}px, ${e.clientY - 6}px, 0)`;
      }
    };
    const onDown = () => setIsClicked(true);
    const onUp = () => setIsClicked(false);
    const onOver = (e) => {
      const t = e.target;
      setIsHovering(
        t.tagName === "BUTTON" || t.tagName === "A" || t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" || !!t.closest("button") || !!t.closest("a")
      );
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseover", onOver);
    };
  }, []);

  const SIZE = 36;
  const HOVER_SIZE = 56;

  return (
    <>
      {/* Fluid WebGL canvas */}
      <canvas
        id="fluid"
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Cursor circle — inverts theme colors on hover */}
      <motion.div
        animate={{
          x: mousePosition.x - (isHovering ? HOVER_SIZE / 2 : SIZE / 2),
          y: mousePosition.y - (isHovering ? HOVER_SIZE / 2 : SIZE / 2),
          width: isHovering ? HOVER_SIZE : SIZE,
          height: isHovering ? HOVER_SIZE : SIZE,
          scale: isClicked ? 0.85 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.5 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          borderRadius: "50%",
          backgroundColor: "#fff",
          pointerEvents: "none",
          zIndex: 9998,
          mixBlendMode: isHovering ? "exclusion" : "difference",
        }}
      />

      {/* Zero-latency core cursor star */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 12,
          height: 12,
          backgroundColor: "#fef08a",
          clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          filter: "drop-shadow(0 0 8px rgba(253, 224, 71, 0.9))",
          pointerEvents: "none",
          zIndex: 10000,
          willChange: "transform",
        }}
      />
    </>
  );
}
