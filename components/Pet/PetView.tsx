
import React, { useState, useMemo, useEffect } from 'react';
import { User, Pet } from '../../types';
import PetModel from './PetModel';
import { authService } from '../../services/authService';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Home, Heart, Sparkles, Utensils, ArrowUpCircle, Palette, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PetViewProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

export default function PetView({ user, onUserUpdated }: PetViewProps) {
  const [isPetting, setIsPetting] = useState(false);
  const [isFeeding, setIsFeeding] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user.pet?.name || 'Buddy');

  const pet = user.pet;
  
  // Auto-initialize pet if missing (safety fallback)
  useEffect(() => {
    const initPet = async () => {
      if (!pet) {
        const updated = await authService.updateUser(user.id, {
          pet: {
            name: 'Buddy',
            level: 0,
            food: Math.floor((user.exp || 0) / 10), // Initial conversion
            colorTheme: 1 as 1 | 2 | 3,
            isSleeping: false,
            lastSleepTime: 0,
            isHidden: false
          }
        });
        if (updated) onUserUpdated(updated);
      } else if (pet.food === 0 && user.exp >= 10) {
        const foodFromExp = Math.floor(user.exp / 10);
        if (foodFromExp > 0) {
          const updated = await authService.updateUser(user.id, {
            pet: { ...pet, food: foodFromExp }
          });
          if (updated) onUserUpdated(updated);
        }
      }
    };
    initPet();
  }, [pet, user.id, user.exp, onUserUpdated]);

  // If pet is missing, show a loading state briefly while it initializes
  if (!pet) {
    return (
      <div className="min-h-[700px] flex items-center justify-center bg-slate-50 rounded-[3rem]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <div className="animate-pulse text-slate-400 font-black uppercase tracking-widest">Pet under maintenance...</div>
        </div>
      </div>
    );
  }

  const handlePetting = async () => {
    setIsPetting(true);
    
    // Update last petted time
    const updated = await authService.updateUser(user.id, {
      pet: { ...pet, lastPettedTime: Date.now() }
    });
    if (updated) onUserUpdated(updated);

    setTimeout(() => setIsPetting(false), 1000); // Shorter duration for click feedback
  };

  const getFoodNeededForNextLevel = (currentLevel: number) => {
    if (currentLevel === 0) return 10;
    return 10 + (currentLevel * 2);
  };

  const handleFeeding = async () => {
    const foodNeeded = getFoodNeededForNextLevel(pet.level);
    
    if (pet.food < foodNeeded) {
      return;
    }

    setIsFeeding(true);
    
    const newFood = pet.food - foodNeeded;
    const newLevel = pet.level + 1;
    
    const updated = await authService.updateUser(user.id, {
      pet: { ...pet, food: newFood, level: newLevel }
    });
    
    if (updated) {
      onUserUpdated(updated);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB6C1', '#FFFFFF', '#FF69B4']
      });
    }

    setTimeout(() => setIsFeeding(false), 1000);
  };

  const handleThemeChange = async (theme: 1 | 2 | 3) => {
    const updated = await authService.updateUser(user.id, {
      pet: { ...pet, colorTheme: theme }
    });
    if (updated) onUserUpdated(updated);
  };

  const handleNameSave = async () => {
    const updated = await authService.updateUser(user.id, {
      pet: { ...pet, name: newName }
    });
    if (updated) onUserUpdated(updated);
    setIsEditingName(false);
  };

  return (
    <div className="min-h-[700px] w-full rounded-[3rem] overflow-hidden relative bg-slate-50 shadow-inner flex flex-col items-center justify-center p-10 text-center">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10" />
      
      <div className="relative z-20 flex flex-col items-center max-w-md">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-accent mb-8 animate-pulse">
          <Sparkles size={48} />
        </div>
        
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4">
          Pet Under Maintenance
        </h2>
        
        <p className="text-slate-500 font-medium leading-relaxed">
          The pet system is being upgraded to provide a better experience for you. 
          Please come back later! ✨
        </p>
        
        <div className="mt-10 px-6 py-3 bg-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Coming Soon
        </div>
      </div>
    </div>
  );
}
