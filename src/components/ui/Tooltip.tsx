"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
  placement?: "top" | "right" | "bottom" | "left";
}

export function Tooltip({
  children,
  content,
  className,
  wrapperClassName,
  placement = "top",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
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

          // Adjust for viewport boundaries if tooltip is rendered
          let newArrowStyle: React.CSSProperties = {};
          if (tooltipRef.current) {
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const padding = 10;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (placement === "top" || placement === "bottom") {
              const tooltipHalfWidth = tooltipRect.width / 2;
              const expectedLeft = left - tooltipHalfWidth;
              const expectedRight = left + tooltipHalfWidth;

              if (expectedRight > viewportWidth - padding) {
                const shift = expectedRight - (viewportWidth - padding);
                left -= shift;
                newArrowStyle = { left: `calc(50% + ${shift}px)` };
              } else if (expectedLeft < padding) {
                const shift = padding - expectedLeft;
                left += shift;
                newArrowStyle = { left: `calc(50% - ${shift}px)` };
              }
            } else if (placement === "left" || placement === "right") {
              const tooltipHalfHeight = tooltipRect.height / 2;
              const expectedTop = top - tooltipHalfHeight;
              const expectedBottom = top + tooltipHalfHeight;

              if (expectedBottom > viewportHeight - padding) {
                const shift = expectedBottom - (viewportHeight - padding);
                top -= shift;
                newArrowStyle = { top: `calc(50% + ${shift}px)` };
              } else if (expectedTop < padding) {
                const shift = padding - expectedTop;
                top += shift;
                newArrowStyle = { top: `calc(50% - ${shift}px)` };
              }
            }
          }

          setPosition({ top, left });
          setArrowStyle(newArrowStyle);
        }
      };

      updatePosition();
      // We need to measure it once it's rendered to adjust bounds
      const raf = requestAnimationFrame(() => {
        updatePosition();
      });

      // Update on scroll/resize
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible, placement, content]);


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

  const baseClasses = {
    top: "-translate-x-1/2 -translate-y-full",
    bottom: "-translate-x-1/2",
    right: "-translate-y-1/2",
    left: "-translate-x-full -translate-y-1/2",
  };

  const animationClasses = {
    top: "animate-tooltip-top",
    bottom: "animate-tooltip-bottom",
    right: "animate-tooltip-right",
    left: "animate-tooltip-left",
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      className={twMerge("relative cursor-help mx-0", wrapperClassName)}
    >
      {children}
      {isVisible && (
        <Portal>
          <div
            ref={tooltipRef}
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
                "relative px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-950 dark:text-slate-200 rounded-lg shadow-xl border border-slate-700/50 dark:border-slate-800 backdrop-blur-sm text-center",
                animationClasses[placement],
                className
              )}
            >
              {content}
              {/* Arrow */}
              <div
                style={arrowStyle}
                className={clsx(
                  "absolute w-2 h-2 bg-slate-900 dark:bg-slate-950 rotate-45 border-slate-700/50 dark:border-slate-800",
                  arrowClasses[placement]
                )}
              />
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

const Portal = ({ children }: { children: React.ReactNode }) => {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
};
