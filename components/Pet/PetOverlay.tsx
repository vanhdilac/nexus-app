
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Pet, User } from '../../types';
import PetModel from './PetModel';
import { authService } from '../../services/authService';
import { Sparkles, Ghost, Home, Moon } from 'lucide-react';

interface PetOverlayProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

export default function PetOverlay({ user, onUserUpdated }: PetOverlayProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isStruggling, setIsStruggling] = useState(false);
  const [isPuffing, setIsPuffing] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [showSummonButton, setShowSummonButton] = useState(false);
  const [targetElement, setTargetElement] = useState<string | null>(null);
  const [clingSide, setClingSide] = useState<'top' | 'bottom' | 'left' | 'right' | 'none'>('none');
  
  const petRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const pet = user.pet;

  // Check sleep status
  useEffect(() => {
    if (!pet || pet.level === 0) return;
    
    const checkSleep = () => {
      const now = Date.now();
      const threeHours = 3 * 60 * 60 * 1000;
      const sleepDuration = 30 * 60 * 1000; // Let's say it sleeps for 30 mins every 3 hours

      const timeSinceLastSleep = now - (pet.lastSleepTime || 0);
      
      if (timeSinceLastSleep >= threeHours) {
        // Time to sleep
        if (!pet.isSleeping) {
          const updated = authService.updateUser(user.id, {
            pet: { ...pet, isSleeping: true, lastSleepTime: now }
          });
          if (updated) onUserUpdated(updated);
        }
      } else if (pet.isSleeping && timeSinceLastSleep >= sleepDuration) {
        // Wake up
        const updated = authService.updateUser(user.id, {
          pet: { ...pet, isSleeping: false }
        });
        if (updated) onUserUpdated(updated);
      }
    };

    const interval = setInterval(checkSleep, 60000); // Check every minute
    checkSleep();
    return () => clearInterval(interval);
  }, [pet, user.id, onUserUpdated]);

  // Movement logic
  useEffect(() => {
    if (!pet || pet.level === 0 || pet.isHidden || pet.isSleeping || isStruggling) return;

    const movePet = () => {
      const chance = Math.random();
      
      if (chance < 0.3) {
        // Move to a random edge
        const side = ['top', 'bottom', 'left', 'right'][Math.floor(Math.random() * 4)];
        let newX = position.x;
        let newY = position.y;
        
        if (side === 'top') { newY = 20; newX = Math.random() * (window.innerWidth - 100); setClingSide('top'); }
        else if (side === 'bottom') { newY = window.innerHeight - 120; newX = Math.random() * (window.innerWidth - 100); setClingSide('bottom'); }
        else if (side === 'left') { newX = 20; newY = Math.random() * (window.innerHeight - 100); setClingSide('left'); }
        else if (side === 'right') { newX = window.innerWidth - 120; newY = Math.random() * (window.innerHeight - 100); setClingSide('right'); }
        
        setPosition({ x: newX, y: newY });
      } else if (chance < 0.6) {
        // Move to a random element (simulated by finding some common selectors)
        const elements = document.querySelectorAll('.bg-white, .rounded-3xl, button');
        if (elements.length > 0) {
          const el = elements[Math.floor(Math.random() * elements.length)];
          const rect = el.getBoundingClientRect();
          setPosition({ 
            x: rect.left + rect.width / 2 - 50, 
            y: rect.top - 80 
          });
          setClingSide('bottom'); // Cling to the top of the element
        }
      }
    };

    const interval = setInterval(movePet, 15000 + Math.random() * 10000);
    return () => clearInterval(interval);
  }, [pet, position, isStruggling]);

  if (!pet || pet.level === 0) return null;

  const handleDragStart = () => {
    setIsStruggling(true);
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsStruggling(false);
    setPosition({ x: info.point.x - 50, y: info.point.y - 50 });
  };

  const handleHide = () => {
    setIsPuffing(true);
    setTimeout(() => {
      const updated = authService.updateUser(user.id, {
        pet: { ...pet, isHidden: true }
      });
      if (updated) onUserUpdated(updated);
      setIsPuffing(false);
    }, 500);
  };

  const handleSummon = () => {
    if (pet.isSleeping) {
      alert(`${pet.name} is sleeping, play with them later! 😴`);
      return;
    }
    
    setIsPuffing(true);
    setTimeout(() => {
      const updated = authService.updateUser(user.id, {
        pet: { ...pet, isHidden: false }
      });
      if (updated) onUserUpdated(updated);
      setIsPuffing(false);
      setPosition({ x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 - 50 });
    }, 500);
  };

  return null;
}
