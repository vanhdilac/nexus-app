
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface PetModelProps {
  level: number;
  colorTheme: 1 | 2 | 3;
  isStruggling?: boolean;
  isSleeping?: boolean;
  isPetting?: boolean;
  className?: string;
}

export default function PetModel({ level, colorTheme, isStruggling, isSleeping, isPetting, className }: PetModelProps) {
  const colors = useMemo(() => {
    switch (colorTheme) {
      case 1: return { primary: '#FFFFFF', secondary: '#FFB6C1', accent: '#FF69B4' }; // Pink
      case 2: return { primary: '#FFFFFF', secondary: '#E6E6FA', accent: '#9370DB' }; // Purple
      case 3: return { primary: '#FFFFFF', secondary: '#FFE4E1', accent: '#FF4500' }; // Orange-Red
      default: return { primary: '#FFFFFF', secondary: '#FFB6C1', accent: '#FF69B4' };
    }
  }, [colorTheme]);

  if (level === 0) {
    // Egg form
    return (
      <motion.div 
        className={`relative ${className}`}
        animate={isPetting ? {
          rotate: [-15, 15, -15, 15, 0],
          x: [-5, 5, -5, 5, 0],
          scale: [1, 1.1, 0.9, 1.1, 1]
        } : {
          rotate: [-3, 3, -3],
          y: [0, -5, 0]
        }}
        transition={isPetting ? {
          duration: 0.4,
          repeat: 0,
          ease: "easeInOut"
        } : {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl">
          {/* Egg Body */}
          <path 
            d="M50,10 C25,10 10,40 10,75 C10,100 25,115 50,115 C75,115 90,100 90,75 C90,40 75,10 50,10 Z" 
            fill={colors.primary} 
            stroke={colors.secondary}
            strokeWidth="3"
          />
          {/* Decorative Spots */}
          <circle cx="35" cy="40" r="8" fill={colors.secondary} opacity="0.6" />
          <circle cx="65" cy="65" r="12" fill={colors.secondary} opacity="0.4" />
          <circle cx="40" cy="90" r="6" fill={colors.secondary} opacity="0.5" />
          
          {/* Subtle breathing pulse for egg */}
          <motion.path 
            d="M50,20 C35,20 25,45 25,75 C25,95 35,105 50,105 C65,105 75,95 75,75 C75,45 65,20 50,20 Z" 
            fill="white" 
            opacity="0.2"
            animate={{ opacity: [0.1, 0.4, 0.1], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </svg>
      </motion.div>
    );
  }

  // Cat form (Level 1+)
  return (
    <motion.div 
      className={`relative ${className}`}
      animate={isStruggling ? {
        rotate: [-5, 5, -5],
        x: [-2, 2, -2],
        y: [-2, 2, -2]
      } : {
        y: [0, -4, 0]
      }}
      transition={isStruggling ? {
        duration: 0.1,
        repeat: Infinity
      } : {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-lg">
        {/* Tail */}
        <motion.path 
          d="M90,100 Q120,80 110,50 Q100,20 80,40" 
          fill="none" 
          stroke={colors.primary} 
          strokeWidth="12" 
          strokeLinecap="round"
          animate={{
            rotate: [-10, 10, -10],
            d: [
              "M90,100 Q120,80 110,50 Q100,20 80,40",
              "M90,100 Q130,90 120,60 Q110,30 90,50",
              "M90,100 Q120,80 110,50 Q100,20 80,40"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Body */}
        <ellipse cx="60" cy="90" rx="35" ry="30" fill={colors.primary} />
        
        {/* Head */}
        <motion.g
          animate={isSleeping ? {} : {
            y: [0, -2, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Ears */}
          <path d="M35,55 L20,25 L50,45 Z" fill={colors.primary} />
          <path d="M85,55 L100,25 L70,45 Z" fill={colors.primary} />
          <path d="M35,55 L28,35 L45,48 Z" fill={colors.secondary} />
          <path d="M85,55 L92,35 L75,48 Z" fill={colors.secondary} />
          
          {/* Face */}
          <circle cx="60" cy="65" r="32" fill={colors.primary} />
          
          {/* Eyes */}
          {isSleeping ? (
            <>
              <path d="M40,65 Q45,70 50,65" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" />
              <path d="M70,65 Q75,70 80,65" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : isPetting ? (
            <>
              <path d="M38,68 Q45,60 52,68" fill="none" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" />
              <path d="M68,68 Q75,60 82,68" fill="none" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <motion.g
                animate={{
                  x: [-2, 2, -2, 0, 0],
                  y: [0, 0, 0, -1, 1]
                }}
                transition={{ duration: 5, repeat: Infinity, times: [0, 0.1, 0.2, 0.8, 0.9] }}
              >
                <circle cx="45" cy="65" r="8" fill="#333" />
                <circle cx="42" cy="62" r="3" fill="white" />
                <circle cx="75" cy="65" r="8" fill="#333" />
                <circle cx="72" cy="62" r="3" fill="white" />
              </motion.g>
            </>
          )}

          {/* Nose & Mouth */}
          <path d="M58,75 L62,75 L60,78 Z" fill={colors.secondary} />
          <path d="M55,82 Q60,85 65,82" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Whiskers */}
          <line x1="30" y1="75" x2="10" y2="72" stroke="#ddd" strokeWidth="1" />
          <line x1="30" y1="80" x2="10" y2="82" stroke="#ddd" strokeWidth="1" />
          <line x1="90" y1="75" x2="110" y2="72" stroke="#ddd" strokeWidth="1" />
          <line x1="90" y1="80" x2="110" y2="82" stroke="#ddd" strokeWidth="1" />
        </motion.g>

        {/* Wings (Flying Cat) */}
        <motion.g
          animate={{
            rotate: [-15, 15, -15],
            scale: [0.9, 1.1, 0.9]
          }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M30,80 Q10,60 5,90 Q15,100 30,90" fill={colors.secondary} opacity="0.6" />
          <path d="M90,80 Q110,60 115,90 Q105,100 90,90" fill={colors.secondary} opacity="0.6" />
        </motion.g>

        {/* Paws */}
        <circle cx="40" cy="115" r="8" fill={colors.primary} />
        <circle cx="80" cy="115" r="8" fill={colors.primary} />
      </svg>

      {/* Hearts when petting */}
      {isPetting && (
        <div className="absolute -top-10 left-0 right-0 flex justify-center gap-2">
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], y: -40, scale: [0.5, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
              className="text-rose-400"
            >
              ❤️
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
