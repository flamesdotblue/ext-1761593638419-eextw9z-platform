import React from 'react';

// NES-style minimalist HUD. Uses limited palette via CSS vars applied in App.
export default function HUD({ stats, inventory, mode, area, prompt }) {
  const { level = 1, xp = 0, hp = 10, maxHp = 10, atk = 1, def = 0 } = stats || {};
  const inv = inventory || [];

  return (
    <div className="fixed left-0 right-0 top-0 z-30">
      <div className="mx-auto mt-2 w-[95%] rounded border border-[var(--nes-dark)] bg-[color:var(--nes-black)/0.8] p-2 text-[var(--nes-green)] shadow-[0_0_0_2px_var(--nes-dark)_inset]">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
          <div className="flex items-center gap-2">
            <span className="bg-[var(--nes-dark)] px-1 py-[2px] text-[var(--nes-light)]">LV {level.toString().padStart(2, '0')}</span>
            <span className="opacity-80">XP {xp.toString().padStart(3, '0')}</span>
            <span className="opacity-80">HP {hp.toString().padStart(2, '0')}/{maxHp.toString().padStart(2, '0')}</span>
            <span className="opacity-80">ATK {atk}</span>
            <span className="opacity-80">DEF {def}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-80">{mode === 'text' ? 'TEXT' : mode === 'platform' ? 'PLAT' : 'RPG'}</span>
            <span className="bg-[var(--nes-dark)] px-1 py-[2px] text-[var(--nes-light)]">{area || 'START'}</span>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px]">
          <span className="opacity-70">INV</span>
          <div className="flex flex-wrap gap-1">
            {inv.length === 0 ? (
              <span className="opacity-50">—</span>
            ) : (
              inv.map((it, i) => (
                <span key={i} className="border border-[var(--nes-dark)] bg-[var(--nes-deep)] px-1 text-[var(--nes-light)]">
                  {it}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="mt-2 text-[10px] leading-relaxed opacity-70">
          Parser understands: LOOK, TAKE &lt;item&gt;, USE &lt;item&gt;, JUMP, OPEN, TALK GUARDIAN, FIGHT FEAR.
        </div>
      </div>
    </div>
  );
}
