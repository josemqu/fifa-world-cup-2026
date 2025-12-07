"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
}

export function Tooltip({ children, content }: TooltipProps) {
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
          setPosition({
            top: rect.top - 8, // 8px gap
            left: rect.left + rect.width / 2,
          });
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
  }, [isVisible]);

  if (!mounted) return <>{children}</>;

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      className="inline-block relative cursor-help mx-1"
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <Portal>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10, x: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, scale: 0.9, y: 10, x: "-50%" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                top: position.top,
                left: position.left,
                position: "fixed",
                zIndex: 9999,
              }}
              className="pointer-events-none -translate-y-full"
            >
              <div className="relative px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg shadow-xl whitespace-nowrap border border-slate-700/50 dark:border-slate-200/50 backdrop-blur-sm">
                {content}
                {/* Arrow */}
                <div className="absolute w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45 left-1/2 -bottom-1 -translate-x-1/2 border-r border-b border-slate-700/50 dark:border-slate-200/50" />
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
