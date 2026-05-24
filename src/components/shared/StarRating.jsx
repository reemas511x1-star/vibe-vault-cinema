import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function StarRating({ value = 0, onChange, readonly = false, size = 'md', halfStars = true }) {
  const [hover, setHover] = useState(0);
  const stars = [1, 2, 3, 4, 5];
  const sz = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-3xl' : 'text-xl';

  function getStarType(star) {
    const active = hover || value;
    if (star <= Math.floor(active)) return 'full';
    if (halfStars && star - 0.5 <= active && active < star) return 'half';
    return 'empty';
  }

  function handleMouseMove(e, star) {
    if (readonly) return;
    if (halfStars) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setHover(x < rect.width / 2 ? star - 0.5 : star);
    } else {
      setHover(star);
    }
  }

  function handleClick(e, star) {
    if (readonly || !onChange) return;
    if (halfStars) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newVal = x < rect.width / 2 ? star - 0.5 : star;
      onChange(newVal === value ? 0 : newVal);
    } else {
      onChange(star === value ? 0 : star);
    }
  }

  const displayValue = hover || value;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex items-center gap-0.5 ${readonly ? '' : 'cursor-pointer'}`}
        onMouseLeave={() => setHover(0)}
      >
        {stars.map(star => {
          const type = getStarType(star);
          return (
            <motion.span
              key={star}
              className={`${sz} select-none leading-none`}
              onMouseMove={e => handleMouseMove(e, star)}
              onClick={e => handleClick(e, star)}
              whileHover={!readonly ? { scale: 1.25 } : {}}
              whileTap={!readonly ? { scale: 0.9 } : {}}
            >
              {type === 'full' && (
                <span style={{ color: '#f5c518', filter: 'drop-shadow(0 0 4px rgba(245,197,24,0.7))' }}>★</span>
              )}
              {type === 'half' && (
                <span style={{
                  background: 'linear-gradient(90deg, #f5c518 50%, rgba(255,255,255,0.18) 50%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>★</span>
              )}
              {type === 'empty' && (
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>★</span>
              )}
            </motion.span>
          );
        })}
      </div>

      {/* Numeric display */}
      {displayValue > 0 && (
        <span className="text-sm font-semibold" style={{ color: '#f5c518' }}>
          {displayValue % 1 === 0 ? displayValue + '.0' : displayValue}
        </span>
      )}
    </div>
  );
}
