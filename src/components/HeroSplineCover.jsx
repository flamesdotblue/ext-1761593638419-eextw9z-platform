import React, { useEffect } from 'react';
import Spline from '@splinetool/react-spline';

export default function HeroSplineCover({ onInteract }) {
  useEffect(() => {
    const h = () => onInteract && onInteract();
    window.addEventListener('pointerdown', h, { once: true });
    window.addEventListener('keydown', h, { once: true });
    return () => {
      window.removeEventListener('pointerdown', h);
      window.removeEventListener('keydown', h);
    };
  }, [onInteract]);

  return (
    <div className="h-full w-full">
      <Spline scene="https://prod.spline.design/OIGfFUmCnZ3VD8gH/scene.splinecode" style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
