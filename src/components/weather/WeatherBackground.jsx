import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';

// Mood preset backgrounds
const moodBgs = {
  'Masculine Dark': {
    bg: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 40%, #111127 100%)',
    particle: null,
  },
  'Light': {
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    particle: null,
  },
  'Feminine Vibrant': {
    bg: 'linear-gradient(135deg, #1a0a2e 0%, #2d0a47 40%, #4a0a60 100%)',
    overlay: 'rgba(253, 121, 168, 0.05)',
    particle: null,
  },
  'Feminine Soft': {
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #2a1a3e 40%, #3d1a4e 100%)',
    particle: null,
  },
  'Neutral': {
    bg: 'linear-gradient(135deg, #111118 0%, #1a1a25 50%, #141420 100%)',
    particle: null,
  },
  'Dark': {
    bg: 'linear-gradient(135deg, #050508 0%, #080810 50%, #0a0a14 100%)',
    particle: null,
  },
};

// Weather config
const weatherConfig = {
  Sunny: { bg: 'linear-gradient(135deg, #0a0a0f 0%, #1a1000 40%, #2a1500 100%)', type: 'sun' },
  Stormy: { bg: 'linear-gradient(135deg, #050508 0%, #0a0a12 30%, #080812 100%)', type: 'storm' },
  Cloudy: { bg: 'linear-gradient(135deg, #0a0a0f 0%, #111118 40%, #141420 100%)', type: 'clouds' },
  Rainy: { bg: 'linear-gradient(135deg, #040408 0%, #080812 40%, #0a0a16 100%)', type: 'rain' },
  Sandstorm: { bg: 'linear-gradient(135deg, #150a00 0%, #1f1000 40%, #2a1500 100%)', type: 'sand' },
  Blizzard: { bg: 'linear-gradient(135deg, #080810 0%, #0c0c18 40%, #10101e 100%)', type: 'snow' },
  'Thunder & Lightning': { bg: 'linear-gradient(135deg, #03030a 0%, #050510 40%, #080818 100%)', type: 'thunder' },
  'Night Rain': { bg: 'linear-gradient(135deg, #020206 0%, #040410 40%, #060614 100%)', type: 'nightrain' },
  'Morning Rain': { bg: 'linear-gradient(135deg, #080810 0%, #0f0f1e 40%, #12122a 100%)', type: 'morningrain' },
  'Autumn': { bg: 'linear-gradient(135deg, #100800 0%, #1a0f00 40%, #1f1200 100%)', type: 'autumn' },
};

function RainDrops({ count = 120, color = 'rgba(100,149,237,0.4)', nightMode = false }) {
  const drops = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 2,
    duration: 0.6 + Math.random() * 0.5,
    width: 1 + Math.random(),
    height: 15 + Math.random() * 25,
    opacity: 0.3 + Math.random() * 0.4,
  })), [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {drops.map(drop => (
        <div
          key={drop.id}
          className="absolute"
          style={{
            left: drop.left,
            top: '-30px',
            width: `${drop.width}px`,
            height: `${drop.height}px`,
            background: nightMode
              ? `linear-gradient(180deg, transparent, rgba(150,180,255,0.5))`
              : `linear-gradient(180deg, transparent, ${color})`,
            borderRadius: '0 0 2px 2px',
            animation: `rainDrop ${drop.duration}s linear ${drop.delay}s infinite`,
            opacity: drop.opacity,
          }}
        />
      ))}
    </div>
  );
}

function SnowFlakes({ count = 80 }) {
  const flakes = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
    size: 3 + Math.random() * 6,
    opacity: 0.4 + Math.random() * 0.4,
  })), [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {flakes.map(flake => (
        <div
          key={flake.id}
          className="absolute rounded-full"
          style={{
            left: flake.left,
            top: '-10px',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(200,220,255,0.6))',
            animation: `snowFlake ${flake.duration}s linear ${flake.delay}s infinite`,
            opacity: flake.opacity,
            filter: 'blur(0.5px)',
          }}
        />
      ))}
    </div>
  );
}

function LightningBolts() {
  const [visible, setVisible] = React.useState(false);
  const [position, setPosition] = React.useState(50);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setPosition(20 + Math.random() * 60);
        setVisible(true);
        setTimeout(() => setVisible(false), 200 + Math.random() * 300);
      }
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-[2]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ background: `radial-gradient(ellipse at ${position}% 20%, rgba(200,200,255,0.15) 0%, transparent 60%)` }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {visible && (
          <motion.svg
            className="fixed pointer-events-none z-[2]"
            style={{ left: `${position}%`, top: 0, width: 40, height: '60vh' }}
            viewBox="0 0 40 400"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.15 }}
          >
            <polyline
              points={`20,0 10,120 22,120 5,300 18,300 0,400`}
              fill="none"
              stroke="rgba(200,200,255,0.9)"
              strokeWidth="2"
              filter="url(#glow)"
            />
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </motion.svg>
        )}
      </AnimatePresence>
    </>
  );
}

function SunRays() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: '-20%',
            left: '50%',
            width: '2px',
            height: '80vh',
            background: 'linear-gradient(180deg, rgba(255,200,50,0.15), transparent)',
            transformOrigin: 'top center',
            transform: `rotate(${i * 45}deg)`,
            animation: `sunRay ${3 + i * 0.5}s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
      <div
        className="absolute rounded-full"
        style={{
          top: '5%',
          left: '70%',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(255,220,50,0.2) 0%, rgba(255,150,0,0.05) 60%, transparent 100%)',
          filter: 'blur(10px)',
          animation: 'pulseGlow 4s ease-in-out infinite',
        }}
      />
    </div>
  );
}

function Clouds({ count = 5, speed = 'slow', opacity = 0.15 }) {
  const clouds = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    top: `${5 + i * 15}%`,
    delay: i * 4,
    duration: 20 + i * 8,
    height: 60 + Math.random() * 80,
    width: 150 + Math.random() * 200,
  })), [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {clouds.map(cloud => (
        <div
          key={cloud.id}
          className="absolute"
          style={{
            top: cloud.top,
            left: '-300px',
            width: `${cloud.width}px`,
            height: `${cloud.height}px`,
            background: 'radial-gradient(ellipse, rgba(180,180,220,0.2), transparent)',
            borderRadius: '50%',
            filter: 'blur(20px)',
            animation: `cloudFloat ${cloud.duration}s linear ${cloud.delay}s infinite`,
            opacity,
          }}
        />
      ))}
    </div>
  );
}

function SandParticles({ count = 200 }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 4,
    size: 1 + Math.random() * 3,
  })), [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            top: p.top,
            left: '-5px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'rgba(210, 160, 80, 0.6)',
            animation: `sandParticle ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '30%',
          background: 'linear-gradient(0deg, rgba(150,80,0,0.1), transparent)',
          animation: 'fogDrift 6s ease-in-out infinite',
        }}
      />
    </div>
  );
}

function AutumnLeaves({ count = 30 }) {
  const leaves = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 8,
    duration: 5 + Math.random() * 5,
    size: 8 + Math.random() * 12,
    color: ['#d4411e', '#e8891a', '#c0392b', '#e67e22', '#f39c12', '#8b2500'][Math.floor(Math.random() * 6)],
  })), [count]);

  const trees = useMemo(() => [
    { left: '5%', height: 200 },
    { left: '15%', height: 180 },
    { left: '80%', height: 220 },
    { left: '92%', height: 190 },
  ], []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {/* Animated trees */}
      {trees.map((tree, i) => (
        <div
          key={i}
          className="absolute bottom-0"
          style={{ left: tree.left }}
        >
          <svg width="80" height={tree.height} viewBox="0 0 80 220" style={{ opacity: 0.4 }}>
            <rect x="35" y="150" width="10" height="70" fill="#3d1a00" />
            <polygon points="40,20 10,120 70,120" fill="#4a1a00" />
            <polygon points="40,50 5,150 75,150" fill="#3d1500" />
            <polygon points="40,80 0,180 80,180" fill="#2d1000" />
          </svg>
        </div>
      ))}
      {/* Falling leaves */}
      {leaves.map(leaf => (
        <div
          key={leaf.id}
          className="absolute"
          style={{
            left: leaf.left,
            top: '-20px',
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
            background: leaf.color,
            borderRadius: '0 60% 0 60%',
            animation: `leafDrift ${leaf.duration}s ease-in-out ${leaf.delay}s infinite`,
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}

function Fog() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1]">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: `${20 + i * 20}%`,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(90deg, transparent, rgba(150,150,200,0.08), transparent)',
            animation: `morningMist ${6 + i * 2}s ease-in-out ${i * 2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function StarField() {
  const stars = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 60}%`,
    size: 1 + Math.random() * 2,
    opacity: 0.3 + Math.random() * 0.5,
    delay: Math.random() * 3,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1]">
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: 'white',
            opacity: star.opacity,
            animation: `pulseGlow ${2 + star.delay}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function WeatherBackground() {
  const { mood, weather } = useApp();

  const getBgStyle = () => {
    if (weather && weatherConfig[weather]) {
      return weatherConfig[weather].bg;
    }
    return moodBgs[mood]?.bg || moodBgs['Masculine Dark'].bg;
  };

  const renderWeatherEffect = () => {
    if (!weather) return null;
    const config = weatherConfig[weather];
    if (!config) return null;

    switch (config.type) {
      case 'sun': return <><SunRays /><Clouds count={2} opacity={0.08} /></>;
      case 'storm': return <><RainDrops count={150} /><Clouds count={8} opacity={0.25} /><LightningBolts /></>;
      case 'clouds': return <Clouds count={6} opacity={0.2} />;
      case 'rain': return <><RainDrops count={100} /><Clouds count={5} opacity={0.2} /></>;
      case 'sand': return <><SandParticles count={180} /></>;
      case 'snow': return <><SnowFlakes count={100} /><Clouds count={4} opacity={0.15} /></>;
      case 'thunder': return <><RainDrops count={120} /><Clouds count={6} opacity={0.3} /><LightningBolts /></>;
      case 'nightrain': return <><RainDrops count={80} color="rgba(80,100,180,0.35)" nightMode={true} /><StarField /></>;
      case 'morningrain': return <><RainDrops count={60} color="rgba(120,150,200,0.3)" /><Fog /><Clouds count={4} opacity={0.15} /></>;
      case 'autumn': return <AutumnLeaves count={25} />;
      default: return null;
    }
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-0"
        animate={{ background: getBgStyle() }}
        transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={weather || mood}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          {renderWeatherEffect()}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
