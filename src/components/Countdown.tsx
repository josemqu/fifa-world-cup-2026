"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CountdownProps {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;
      
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="flex gap-3 md:gap-5 justify-start items-center py-4">
        <CountdownItemSkeleton label="Días" />
        <div className="text-slate-200 dark:text-slate-800 font-bold mb-6 text-xl">:</div>
        <CountdownItemSkeleton label="Horas" />
        <div className="text-slate-200 dark:text-slate-800 font-bold mb-6 text-xl">:</div>
        <CountdownItemSkeleton label="Minutos" />
        <div className="text-slate-200 dark:text-slate-800 font-bold mb-6 text-xl">:</div>
        <CountdownItemSkeleton label="Segundos" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-3 md:gap-5 justify-start items-center py-4"
    >
      <CountdownItem value={timeLeft.days} label="Días" />
      <div className="text-slate-300 dark:text-slate-700 font-bold mb-6 text-xl">:</div>
      <CountdownItem value={timeLeft.hours} label="Horas" />
      <div className="text-slate-300 dark:text-slate-700 font-bold mb-6 text-xl">:</div>
      <CountdownItem value={timeLeft.minutes} label="Minutos" />
      <div className="text-slate-300 dark:text-slate-700 font-bold mb-6 text-xl">:</div>
      <CountdownItem value={timeLeft.seconds} label="Segundos" />
    </motion.div>
  );
}

function CountdownItem({ value, label }: { value: number; label: string }) {
  const displayValue = value.toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-0.5">
        {displayValue.split('').map((digit, idx) => (
          <div 
            key={idx}
            className="relative h-11 md:h-14 w-8 md:w-10 overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] dark:shadow-[0_2px_15px_-3px_rgba(0,0,0,0.3)] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50/50 dark:to-white/[0.02]" />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`${idx}-${digit}`}
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.23, 1, 0.32, 1] 
                }}
                className="relative z-10 text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums"
              >
                {digit}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>
      <span className="mt-2 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </div>
  );
}

function CountdownItemSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-0.5">
        {[0, 1].map((i) => (
          <div key={i} className="h-11 md:h-14 w-8 md:w-10 rounded-lg bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
        ))}
      </div>
      <span className="mt-2 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-400/50 dark:text-slate-500/50">
        {label}
      </span>
    </div>
  );
}
