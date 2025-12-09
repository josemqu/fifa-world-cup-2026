"use client";

import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";

interface FloatingContainerProps {
  children: ReactNode;
  className?: string;
}

export function FloatingContainer({
  children,
  className,
}: FloatingContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={clsx(
        "fixed bottom-36 md:bottom-24 right-4 z-60 flex flex-col gap-3 items-end",
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}

interface FloatingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function FloatingButton({
  children,
  className,
  ...props
}: FloatingButtonProps) {
  return (
    <button
      className={clsx(
        "text-white text-sm px-4 py-2 rounded-full font-medium transition-all shadow-xl flex items-center gap-2 hover:scale-105 hover:shadow-2xl transform duration-200",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
