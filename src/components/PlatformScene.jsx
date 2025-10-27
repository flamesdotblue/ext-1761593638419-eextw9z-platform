import React, { useEffect, useMemo, useRef, useState } from 'react';

function wordRect(word, scale = 1) {
  const width = 8 * word.length * scale + 8;
  const height = 18 * scale;
  return { w: width, h: height };
}

export default function PlatformScene({ mode, words, enemies, onEnemyHit, command }) {
  const containerRef = useRef(null);
  const [player, setPlayer] = useState({ x: 40, y: 40, vx: 0, vy: 0, onGround: false, facing: 1 });
  const [keys, setKeys] = useState({ left: false, right: false, jump: false });

  const platforms = useMemo(() => words.filter(w => w.type === 'platform'), [words]);
  const npcs = useMemo(() => words.filter(w => w.type === 'npc'), [words]);

  useEffect(() => {
    const onDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setKeys(k => ({ ...k, left: true }));
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setKeys(k => ({ ...k, right: true }));
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') setKeys(k => ({ ...k, jump: true }));
    };
    const onUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setKeys(k => ({ ...k, left: false }));
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setKeys(k => ({ ...k, right: false }));
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') setKeys(k => ({ ...k, jump: false }));
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  useEffect(() => {
    if (command === 'JUMP') setKeys(k => ({ ...k, jump: true }));
  }, [command]);

  useEffect(() => {
    let raf;
    const gravity = 0.6;
    const friction = 0.8;
    const speed = 1.6;
    const jumpImpulse = 8.5;

    const step = () => {
      setPlayer((p) => {
        let { x, y, vx, vy, onGround } = p;
        if (keys.left) vx -= speed;
        if (keys.right) vx += speed;
        vx *= friction;
        vy += gravity;

        // jump
        if (keys.jump && onGround) {
          vy = -jumpImpulse;
          onGround = false;
        }

        let nx = x + vx;
        let ny = y + vy;
        // bounds
        const maxX = 580; // scene width approx
        const floorY = 220; // scene floor
        if (ny > floorY) { ny = floorY; vy = 0; onGround = true; }
        if (nx < 0) nx = 0;
        if (nx > maxX) nx = maxX;

        // platform collisions
        onGround = ny >= floorY; // reset then check
        const playerBox = { x: nx, y: ny, w: 14, h: 18 };
        for (const pl of platforms) {
          const r = wordRect(pl.text, 1);
          const box = { x: pl.x, y: pl.y, w: r.w, h: 12 };
          const intersectX = playerBox.x < box.x + box.w && playerBox.x + playerBox.w > box.x;
          const wasAbove = y + playerBox.h <= box.y + 1;
          if (intersectX && playerBox.y + playerBox.h >= box.y && wasAbove && vy >= 0) {
            ny = box.y - playerBox.h; vy = 0; onGround = true;
          }
        }

        // enemy interaction - simple overlap triggers hit
        for (const en of enemies) {
          const er = { x: en.x, y: en.y, w: 32, h: 18 };
          const hit = playerBox.x < er.x + er.w && playerBox.x + playerBox.w > er.x && playerBox.y < er.y + er.h && playerBox.y + playerBox.h > er.y;
          if (hit && onEnemyHit) onEnemyHit(en.id);
        }

        return { ...p, x: nx, y: ny, vx, vy, onGround, facing: keys.right ? 1 : keys.left ? -1 : p.facing };
      });
      raf = requestAnimationFrame(step);
    };

    if (mode === 'platform') raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [mode, platforms, enemies, keys, onEnemyHit]);

  return (
    <div ref={containerRef} className="relative h-64 w-full overflow-hidden rounded border border-[var(--nes-dark)] bg-[var(--nes-black)] shadow-[0_0_0_2px_var(--nes-dark)_inset]">
      {/* Floor line */}
      <div className="absolute left-0 right-0" style={{ bottom: 0, height: 2, background: 'var(--nes-dark)' }} />

      {/* Platforms rendered as words */}
      {platforms.map((p) => (
        <div key={p.id} className="absolute select-none text-[12px] font-bold tracking-[2px] text-[var(--nes-green)]" style={{ left: p.x, top: p.y }}>
          {p.text}
        </div>
      ))}

      {/* NPCs semantic characters */}
      {npcs.map((npc) => (
        <div key={npc.id} className="absolute select-none text-[12px] font-bold text-[var(--nes-light)]" style={{ left: npc.x, top: npc.y }}>
          {npc.text === 'GUARDIAN' ? '🛡️' : npc.text}
        </div>
      ))}

      {/* Enemies from negative words */}
      {enemies.map((e) => (
        <div key={e.id} className="absolute select-none text-[12px] font-bold text-[var(--nes-accent)]" style={{ left: e.x, top: e.y }}>
          {e.word}
        </div>
      ))}

      {/* Player Sprite - 8-bit styled blocky avatar */}
      <div className="absolute" style={{ left: player.x, top: player.y }}>
        <div className="h-[18px] w-[14px] border border-[var(--nes-dark)] bg-[var(--nes-green)]" />
        <div className="mt-1 text-[8px] text-[var(--nes-light)]/60">you</div>
      </div>

      {/* Hint overlay */}
      {mode !== 'platform' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] text-[var(--nes-light)]/60">
          Enter platform mode via commands (e.g., JUMP, LOOK, BEGIN)
        </div>
      )}
    </div>
  );
}
