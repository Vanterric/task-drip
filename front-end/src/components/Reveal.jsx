import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function Reveal({ children, delay = 0, yOffset = 50, xOffset = 0, duration = 0.6, className = "", margin = "-100px" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: margin });

  return (
    <motion.div
      className={className}
      ref={ref}
      initial={{ opacity: 0, y: yOffset, x: xOffset }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y: yOffset, x: xOffset }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
