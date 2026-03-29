import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Cursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringOptions, setIsHoveringOptions] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    const handleMouseOver = (e) => {
      if (
        e.target.tagName.toLowerCase() === 'button' || 
        e.target.tagName.toLowerCase() === 'a' ||
        e.target.closest('button') || 
        e.target.closest('a') ||
        e.target.tagName.toLowerCase() === 'input' ||
        e.target.tagName.toLowerCase() === 'textarea'
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

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <>
      <motion.div
        className="custom-cursor"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isClicked ? 0.8 : (isHoveringOptions ? 1.4 : 1),
          opacity: 1
        }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
        style={{
          position: "fixed", top: 0, left: 0, width: 32, height: 32,
          borderRadius: "50%",
          backgroundColor: isHoveringOptions ? "transparent" : "var(--text-primary)",
          border: isHoveringOptions ? "1.5px solid var(--text-primary)" : "none",
          pointerEvents: "none", zIndex: 9999, mixBlendMode: "difference"
        }}
      />
      <motion.div
        className="custom-cursor-dot"
        animate={{
          x: mousePosition.x - 3,
          y: mousePosition.y - 3,
          scale: isClicked ? 0.5 : 1,
          opacity: isHoveringOptions ? 0 : 1
        }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
        style={{
          position: "fixed", top: 0, left: 0, width: 6, height: 6,
          borderRadius: "50%", backgroundColor: "var(--bg-base)",
          pointerEvents: "none", zIndex: 10000, mixBlendMode: "difference"
        }}
      />
    </>
  );
}
