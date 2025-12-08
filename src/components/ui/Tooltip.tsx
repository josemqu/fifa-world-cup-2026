"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  placement?: "top" | "right" | "bottom" | "left";
}

export function Tooltip({
  children,
  content,
  className,
  placement = "top",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const gap = 8;
          let top = 0;
          let left = 0;

          switch (placement) {
            case "top":
              top = rect.top - gap;
              left = rect.left + rect.width / 2;
              break;
            case "right":
              top = rect.top + rect.height / 2;
              left = rect.right + gap;
              break;
            case "bottom":
              top = rect.bottom + gap;
              left = rect.left + rect.width / 2;
              break;
            case "left":
              top = rect.top + rect.height / 2;
              left = rect.left - gap;
              break;
          }
          setPosition({ top, left });
        }
      };

      updatePosition();
      // Update on scroll/resize
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible, placement]);

  if (!mounted) return <>{children}</>;

  const variants = {
    top: {
      initial: { opacity: 0, scale: 0.9, y: 10, x: "-50%" },
      animate: { opacity: 1, scale: 1, y: 0, x: "-50%" },
      exit: { opacity: 0, scale: 0.9, y: 10, x: "-50%" },
    },
    bottom: {
      initial: { opacity: 0, scale: 0.9, y: -10, x: "-50%" },
      animate: { opacity: 1, scale: 1, y: 0, x: "-50%" },
      exit: { opacity: 0, scale: 0.9, y: -10, x: "-50%" },
    },
    right: {
      initial: { opacity: 0, scale: 0.9, x: -10, y: "-50%" },
      animate: { opacity: 1, scale: 1, x: 0, y: "-50%" },
      exit: { opacity: 0, scale: 0.9, x: -10, y: "-50%" },
    },
    left: {
      initial: { opacity: 0, scale: 0.9, x: 10, y: "-50%" },
      animate: { opacity: 1, scale: 1, x: 0, y: "-50%" },
      exit: { opacity: 0, scale: 0.9, x: 10, y: "-50%" },
    },
  };

  const arrowClasses = {
    top: "left-1/2 -bottom-1 -translate-x-1/2 border-r border-b",
    bottom: "left-1/2 -top-1 -translate-x-1/2 border-l border-t",
    right: "left-[-5px] top-1/2 -translate-y-1/2 border-l border-b",
    left: "right-[-5px] top-1/2 -translate-y-1/2 border-r border-t",
  };

  // Determine the transform class for the fixed container (not the motion div, but keeping consistent with previous logic)
  // Actually, simpler to just rely on motion div for transform and fixed position.
  // The previous implementation used `className="pointer-events-none -translate-y-full"` for top placement.
  // We need to adjust this base translation based on placement because the motion div handles the entry animation offset, but the base positioning logic expects an origin.
  //
  // 'top': position is at (top-gap, center). We need to translate(-50%, -100%).
  // 'bottom': position is at (bottom+gap, center). We need to translate(-50%, 0).
  // 'right': position is at (center, right+gap). We need to translate(0, -50%).
  // 'left': position is at (center, left-gap). We need to translate(-100%, -50%).

  const baseClasses = {
    top: "-translate-y-full",
    bottom: "",
    right: "",
    left: "-translate-x-full",
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      className="inline-block relative cursor-help mx-0"
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <Portal>
            <motion.div
              initial={variants[placement].initial}
              animate={variants[placement].animate}
              exit={variants[placement].exit}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                top: position.top,
                left: position.left,
                position: "fixed",
                zIndex: 9999,
              }}
              className={clsx("pointer-events-none", baseClasses[placement])}
            >
              <div
                className={twMerge(
                  "relative px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg shadow-xl border border-slate-700/50 dark:border-slate-200/50 backdrop-blur-sm text-center",
                  className
                )}
              >
                {content}
                {/* Arrow */}
                <div
                  className={clsx(
                    "absolute w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45 border-slate-700/50 dark:border-slate-200/50",
                    arrowClasses[placement]
                  )}
                />
              </div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}

const Portal = ({ children }: { children: React.ReactNode }) => {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
};
