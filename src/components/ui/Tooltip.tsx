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
  interactive?: boolean;
  onlyShowIfTruncated?: boolean;
  autoAdjustPlacement?: boolean;
}

const getCandidateRect = (
  p: "top" | "bottom" | "left" | "right",
  triggerRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number
) => {
  const gap = 8;
  const padding = 10;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let refTop = 0;
  let refLeft = 0;

  switch (p) {
    case "top":
      refTop = triggerRect.top - gap;
      refLeft = triggerRect.left + triggerRect.width / 2;
      break;
    case "bottom":
      refTop = triggerRect.bottom + gap;
      refLeft = triggerRect.left + triggerRect.width / 2;
      break;
    case "left":
      refTop = triggerRect.top + triggerRect.height / 2;
      refLeft = triggerRect.left - gap;
      break;
    case "right":
      refTop = triggerRect.top + triggerRect.height / 2;
      refLeft = triggerRect.right + gap;
      break;
  }

  let actualLeft = 0;
  let actualTop = 0;
  let shift = 0;

  if (p === "top" || p === "bottom") {
    actualTop = p === "top" ? refTop - tooltipHeight : refTop;
    const naturalLeft = refLeft - tooltipWidth / 2;
    actualLeft = naturalLeft;

    const expectedRight = naturalLeft + tooltipWidth;
    if (expectedRight > viewportWidth - padding) {
      shift = expectedRight - (viewportWidth - padding);
      actualLeft -= shift;
    } else if (naturalLeft < padding) {
      shift = padding - naturalLeft;
      actualLeft += shift;
    }
  } else {
    actualLeft = p === "left" ? refLeft - tooltipWidth : refLeft;
    const naturalTop = refTop - tooltipHeight / 2;
    actualTop = naturalTop;

    const expectedBottom = naturalTop + tooltipHeight;
    if (expectedBottom > viewportHeight - padding) {
      shift = expectedBottom - (viewportHeight - padding);
      actualTop -= shift;
    } else if (naturalTop < padding) {
      shift = padding - naturalTop;
      actualTop += shift;
    }
  }

  const finalShiftX = p === "top" || p === "bottom" ? (actualLeft - (refLeft - tooltipWidth / 2)) : 0;
  const finalShiftY = p === "left" || p === "right" ? (actualTop - (refTop - tooltipHeight / 2)) : 0;

  return {
    rect: {
      left: actualLeft,
      top: actualTop,
      width: tooltipWidth,
      height: tooltipHeight,
      right: actualLeft + tooltipWidth,
      bottom: actualTop + tooltipHeight,
    },
    refTop: p === "top" || p === "bottom" ? refTop : refTop + finalShiftY,
    refLeft: p === "left" || p === "right" ? refLeft : refLeft + finalShiftX,
    shift: p === "top" || p === "bottom" ? finalShiftX : finalShiftY,
  };
};

export function Tooltip({
  children,
  content,
  className,
  wrapperClassName,
  placement = "top",
  interactive = false,
  onlyShowIfTruncated = false,
  autoAdjustPlacement = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState<"top" | "right" | "bottom" | "left">(placement);
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isElementTruncated = (element: HTMLElement): boolean => {
    if (element.clientWidth > 0 && element.scrollWidth - element.clientWidth > 1) {
      return true;
    }
    for (let i = 0; i < element.children.length; i++) {
      const child = element.children[i] as HTMLElement;
      if (child && isElementTruncated(child)) {
        return true;
      }
    }
    return false;
  };

  const showTooltip = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (onlyShowIfTruncated && triggerRef.current) {
      if (!isElementTruncated(triggerRef.current)) {
        return;
      }
    }

    setIsVisible(true);
  };

  const hideTooltip = () => {
    if (interactive) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 150);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setActualPlacement(placement);
    }
  }, [isVisible, placement]);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const gap = 8;
          let top = 0;
          let left = 0;
          let chosenPlacement = placement;
          let newArrowStyle: React.CSSProperties = {};

          const tooltipRect = tooltipRef.current ? tooltipRef.current.getBoundingClientRect() : null;

          if (autoAdjustPlacement && tooltipRect) {
            const tooltipWidth = tooltipRect.width;
            const tooltipHeight = tooltipRect.height;

            const activeFlags = Array.from(document.querySelectorAll('[data-winning-path-flag="true"]'))
              .filter((flag) => triggerRef.current && flag !== triggerRef.current && !triggerRef.current.contains(flag));

            if (activeFlags.length > 0) {
              const placements: ("top" | "bottom" | "left" | "right")[] = [placement];
              const others: ("top" | "bottom" | "left" | "right")[] = ["top", "bottom", "left", "right"];
              others.forEach((p) => {
                if (!placements.includes(p)) {
                  placements.push(p);
                }
              });

              const candidateData = placements.map((p) => {
                const res = getCandidateRect(p, rect, tooltipWidth, tooltipHeight);
                let collisions = 0;
                let minDistance = Infinity;

                activeFlags.forEach((flag) => {
                  const flagRect = flag.getBoundingClientRect();
                  
                  const buffer = 4;
                  const overlaps = !(
                    res.rect.right < flagRect.left - buffer ||
                    res.rect.left > flagRect.right + buffer ||
                    res.rect.bottom < flagRect.top - buffer ||
                    res.rect.top > flagRect.bottom + buffer
                  );

                  if (overlaps) {
                    collisions++;
                  }

                  const cCenter = {
                    x: res.rect.left + res.rect.width / 2,
                    y: res.rect.top + res.rect.height / 2,
                  };
                  const fCenter = {
                    x: flagRect.left + flagRect.width / 2,
                    y: flagRect.top + flagRect.height / 2,
                  };
                  const dist = Math.hypot(cCenter.x - fCenter.x, cCenter.y - fCenter.y);
                  if (dist < minDistance) {
                    minDistance = dist;
                  }
                });

                return {
                  placement: p,
                  refTop: res.refTop,
                  refLeft: res.refLeft,
                  shift: res.shift,
                  collisions,
                  minDistance,
                };
              });

              let best = candidateData[0];
              for (let i = 1; i < candidateData.length; i++) {
                const cand = candidateData[i];
                if (cand.collisions < best.collisions) {
                  best = cand;
                } else if (cand.collisions === best.collisions) {
                  if (best.collisions > 0 && cand.minDistance > best.minDistance) {
                    best = cand;
                  }
                }
              }

              chosenPlacement = best.placement;
              top = best.refTop;
              left = best.refLeft;

              if (chosenPlacement === "top" || chosenPlacement === "bottom") {
                if (Math.abs(best.shift) > 0.1) {
                  newArrowStyle = { left: `calc(50% - ${best.shift}px)` };
                }
              } else if (chosenPlacement === "left" || chosenPlacement === "right") {
                if (Math.abs(best.shift) > 0.1) {
                  newArrowStyle = { top: `calc(50% - ${best.shift}px)` };
                }
              }
            } else {
              calculateStandard();
            }
          } else {
            calculateStandard();
          }

          function calculateStandard() {
            chosenPlacement = placement;
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

            if (tooltipRect) {
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
          }

          setPosition({ top, left });
          setActualPlacement(chosenPlacement);
          setArrowStyle(newArrowStyle);
        }
      };

      updatePosition();
      const raf = requestAnimationFrame(() => {
        updatePosition();
      });

      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible, placement, content, autoAdjustPlacement]);

  const baseClasses = {
    top: "-translate-x-1/2 -translate-y-full",
    bottom: "-translate-x-1/2",
    right: "-translate-y-1/2",
    left: "-translate-x-full -translate-y-1/2",
  };

  const arrowClasses = {
    top: "left-1/2 -bottom-1 -translate-x-1/2 border-r border-b",
    bottom: "left-1/2 -top-1 -translate-x-1/2 border-l border-t",
    right: "left-[-5px] top-1/2 -translate-y-1/2 border-l border-b",
    left: "right-[-5px] top-1/2 -translate-y-1/2 border-r border-t",
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
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      className={twMerge("relative mx-0", wrapperClassName)}
    >
      {children}
      {isVisible && (
        <Portal>
          <div
            ref={tooltipRef}
            onMouseEnter={interactive ? showTooltip : undefined}
            onMouseLeave={interactive ? hideTooltip : undefined}
            style={{
              top: position.top,
              left: position.left,
              position: "fixed",
              zIndex: 100000,
            }}
            className={clsx(
              interactive ? "pointer-events-auto" : "pointer-events-none",
              baseClasses[actualPlacement]
            )}
          >
            <div
              className={twMerge(
                "relative px-3 py-1.5 text-xs font-semibold text-white bg-slate-900/80 dark:bg-slate-950/85 dark:text-slate-200 rounded-lg shadow-xl border border-slate-700/50 dark:border-slate-800 backdrop-blur-md text-center",
                animationClasses[actualPlacement],
                className
              )}
            >
              {content}
              {/* Arrow */}
              <div
                style={arrowStyle}
                className={clsx(
                  "absolute w-2 h-2 bg-slate-900/80 dark:bg-slate-950/85 rotate-45 border-slate-700/50 dark:border-slate-800",
                  arrowClasses[actualPlacement]
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
