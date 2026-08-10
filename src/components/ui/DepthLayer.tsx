import React, { useState } from 'react';
import { motion } from 'motion/react';

export interface DepthLayerProps {
  children: React.ReactNode;
  enableTilt?: boolean;
  className?: string;
  depthIntensity?: 'subtle' | 'medium' | 'high';
}

export const DepthLayer: React.FC<DepthLayerProps> = ({
  children,
  enableTilt = true,
  className = '',
  depthIntensity = 'medium',
}) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const maxDegrees = {
    subtle: 4,
    medium: 8,
    high: 12,
  }[depthIntensity];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * maxDegrees;
    const rotY = ((x - centerX) / centerX) * maxDegrees;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className={`perspective-container ${className}`}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX,
          rotateY,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, mass: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative transition-shadow duration-300"
      >
        {/* Layered Floating Accent Objects for 3D depth */}
        <div
          className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-gradient-to-tr from-blue-400/20 to-sky-300/10 blur-xl pointer-events-none"
          style={{ transform: 'translateZ(-20px)' }}
        />
        <div
          className="absolute -bottom-4 -left-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400/15 to-orange-300/10 blur-xl pointer-events-none"
          style={{ transform: 'translateZ(-30px)' }}
        />

        {/* Core Content Layer */}
        <div style={{ transform: 'translateZ(10px)' }}>{children}</div>
      </motion.div>
    </div>
  );
};
