import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base - white/dark with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" />
      
      {/* Aurora effect - multiple flowing gradients */}
      <div 
        className="absolute inset-0 opacity-60 dark:opacity-40"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 80% at 80% 20%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 70% 60% at 70% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 50% 70% at 10% 90%, rgba(20, 184, 166, 0.08) 0%, transparent 50%)
          `,
        }}
      />

      {/* Animated blob 1 - Large emerald */}
      <div 
        className="absolute w-[600px] h-[600px] animate-blob-1"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.1) 40%, transparent 70%)',
          filter: 'blur(60px)',
          top: '-10%',
          left: '-5%',
        }}
      />

      {/* Animated blob 2 - Teal */}
      <div 
        className="absolute w-[500px] h-[500px] animate-blob-2"
        style={{
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.2) 0%, rgba(6, 182, 212, 0.1) 40%, transparent 70%)',
          filter: 'blur(50px)',
          top: '20%',
          right: '-10%',
        }}
      />

      {/* Animated blob 3 - Cyan accent */}
      <div 
        className="absolute w-[450px] h-[450px] animate-blob-3"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, rgba(16, 185, 129, 0.08) 40%, transparent 70%)',
          filter: 'blur(55px)',
          bottom: '-5%',
          left: '20%',
        }}
      />

      {/* Animated blob 4 - Small emerald */}
      <div 
        className="absolute w-[350px] h-[350px] animate-blob-4"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 60%)',
          filter: 'blur(45px)',
          bottom: '30%',
          right: '15%',
        }}
      />

      {/* Mesh gradient overlay for depth */}
      <div 
        className="absolute inset-0 opacity-40 dark:opacity-30 animate-mesh"
        style={{
          background: `
            conic-gradient(from 0deg at 30% 30%, transparent 0deg, rgba(16, 185, 129, 0.05) 60deg, transparent 120deg),
            conic-gradient(from 180deg at 70% 70%, transparent 0deg, rgba(6, 182, 212, 0.05) 60deg, transparent 120deg)
          `,
        }}
      />

      {/* Particles / floating dots */}
      <div className="absolute inset-0">
        <div className="absolute w-2 h-2 bg-emerald-400/30 rounded-full animate-particle-1" style={{ top: '15%', left: '10%' }} />
        <div className="absolute w-1.5 h-1.5 bg-teal-400/25 rounded-full animate-particle-2" style={{ top: '25%', right: '20%' }} />
        <div className="absolute w-2.5 h-2.5 bg-emerald-300/20 rounded-full animate-particle-3" style={{ bottom: '35%', left: '25%' }} />
        <div className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-particle-4" style={{ top: '60%', right: '35%' }} />
        <div className="absolute w-2 h-2 bg-emerald-400/25 rounded-full animate-particle-5" style={{ bottom: '20%', right: '15%' }} />
        <div className="absolute w-1.5 h-1.5 bg-teal-300/20 rounded-full animate-particle-6" style={{ top: '45%', left: '40%' }} />
        <div className="absolute w-1 h-1 bg-emerald-500/30 rounded-full animate-particle-1" style={{ bottom: '45%', right: '45%' }} />
        <div className="absolute w-2 h-2 bg-cyan-300/20 rounded-full animate-particle-3" style={{ top: '75%', left: '60%' }} />
      </div>

      {/* Subtle noise texture for premium feel */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
