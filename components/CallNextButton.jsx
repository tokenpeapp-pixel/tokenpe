'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Check, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function CallNextButton({ onCall, disabled, nextToken }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'calling' | 'complete'
  const textRef = useRef(null);
  const requestRef = useRef();
  const startTimeRef = useRef();

  const handleCall = () => {
    if (disabled || status !== 'idle') return;
    
    // Trigger the actual backend call immediately
    onCall();
    
    // Enter the cooldown flow
    setStatus('calling');
    startTimeRef.current = performance.now();
    
    const duration = 3000;

    const animateCountdown = (time) => {
      if (!startTimeRef.current) return;
      const elapsed = time - startTimeRef.current;
      const remaining = Math.max(0, duration - elapsed);
      
      if (textRef.current) {
        textRef.current.innerText = (remaining / 1000).toFixed(1) + 's';
      }

      if (elapsed < duration) {
        requestRef.current = requestAnimationFrame(animateCountdown);
      } else {
        setStatus('complete');
        setTimeout(() => {
          setStatus('idle');
        }, 600);
      }
    };

    requestRef.current = requestAnimationFrame(animateCountdown);
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <motion.button
      title={disabled && status === 'idle' ? "No one is currently in the queue" : undefined}
      onClick={handleCall}
      disabled={disabled || status !== 'idle'}
      whileHover={status === 'idle' && !disabled ? { y: -2, boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.4)' } : {}}
      whileTap={status === 'idle' && !disabled ? { scale: 0.98 } : {}}
      className={cn(
        'relative overflow-hidden w-full h-[52px] rounded-[14px] flex items-center justify-center font-bold text-[15px] transition-colors',
        status === 'idle' && !disabled
          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm hover:from-emerald-400 hover:to-emerald-500'
          : 'bg-emerald-50 text-emerald-900 border border-emerald-100 shadow-inner',
        disabled && status === 'idle' && 'cursor-not-allowed bg-[#E2E8F0] text-[#475569] border-none shadow-none'
      )}
      style={{
        cursor: status !== 'idle' ? 'not-allowed' : disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {/* Progress Fill Background */}
      <AnimatePresence>
        {status === 'calling' && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 3, ease: 'linear' }}
            className="absolute inset-0 bg-emerald-100 origin-left"
          >
            {/* Subtle Shimmer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button Content */}
      <div className="relative z-10 flex items-center justify-center gap-2 w-full px-4">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="flex items-center gap-2"
            >
              <Megaphone className="w-[18px] h-[18px]" />
              <span>Call Next {nextToken ? `(${nextToken})` : ''}</span>
            </motion.div>
          )}

          {status === 'calling' && (
            <motion.div
              key="calling"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="flex items-center gap-2 text-emerald-800"
            >
              <Loader2 className="w-[18px] h-[18px] animate-spin text-emerald-600" />
              <span>Calling Patient...</span>
              <span ref={textRef} className="text-emerald-500 font-mono text-[13px] font-semibold w-8 text-right">
                3.0s
              </span>
            </motion.div>
          )}

          {status === 'complete' && (
            <motion.div
              key="complete"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex items-center gap-2 text-emerald-700"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 600, damping: 20, delay: 0.1 }}
                className="bg-emerald-500 rounded-full p-0.5"
              >
                <Check className="w-[14px] h-[14px] text-white" strokeWidth={3} />
              </motion.div>
              <span>Patient Called</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Subtle Inner Highlight */}
      <div className="absolute inset-0 rounded-[14px] ring-1 ring-inset ring-white/20 pointer-events-none" />
    </motion.button>
  );
}
