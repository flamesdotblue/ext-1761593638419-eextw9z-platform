import React, { useEffect, useMemo, useRef, useState } from 'react';
import HeroSplineCover from './components/HeroSplineCover';
import TextAdventurePanel from './components/TextAdventurePanel';
import PlatformScene from './components/PlatformScene';
import HUD from './components/HUD';

function useChiptune() {
  const ctxRef = useRef(null);
  const startedRef = useRef(false);
  const gainRef = useRef(null);
  const seqRef = useRef({ step: 0, timer: null });

  const start = () => {
    if (startedRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = 0.04;
    gain.connect(ctx.destination);
    ctxRef.current = ctx;
    gainRef.current = gain;

    // Simple square wave melody loop
    const notes = [261.63, 293.66, 329.63, 392.0, 329.63, 293.66];
    const loop = () => {
      if (!ctxRef.current) return;
      const osc = ctxRef.current.createOscillator();
      osc.type = 'square';
      const now = ctxRef.current.currentTime;
      const n = notes[seqRef.current.step % notes.length];
      osc.frequency.setValueAtTime(n, now);
      const env = ctxRef.current.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.12, now + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc.connect(env).connect(gainRef.current);
      osc.start(now);
      osc.stop(now + 0.26);
      seqRef.current.step += 1;
      seqRef.current.timer = setTimeout(loop, 280);
    };
    loop();
    startedRef.current = true;
  };

  const click = (pitch = 880, dur = 0.06) => {
    if (!ctxRef.current) return;
    const now = ctxRef.current.currentTime;
    const osc = ctxRef.current.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    const env = ctxRef.current.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.15, now + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(env).connect(gainRef.current);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  };

  useEffect(() => () => {
    if (seqRef.current.timer) clearTimeout(seqRef.current.timer);
    if (ctxRef.current) ctxRef.current.close();
  }, []);

  return { start, click };
}

export default function App() {
  const [mode, setMode] = useState('text'); // 'text' | 'platform' | 'rpg'
  const [area, setArea] = useState('PROLOGUE');
  const [stats, setStats] = useState({ level: 1, xp: 0, hp: 10, maxHp: 10, atk: 1, def: 0 });
  const [inventory, setInventory] = useState([]);
  const [platformWords, setPlatformWords] = useState([]); // { id, text, type: 'platform'|'npc'|'enemy', x, y }
  const [enemies, setEnemies] = useState([]); // { id, word, x, y, hp }
  const [pendingCommand, setPendingCommand] = useState(null); // e.g., 'JUMP'
  const [prompt, setPrompt] = useState('A dim corridor extends into an ABYSS. A faint TORCH lies near a GATE. A silent GUARDIAN watches.');

  const { start: startMusic, click } = useChiptune();

  // Color palette variables for NES feel
  const paletteVars = useMemo(() => ({
    '--nes-black': '#1b1b1b',
    '--nes-dark': '#2e3138',
    '--nes-deep': '#414a59',
    '--nes-green': '#8bd66d',
    '--nes-light': '#e6f4ea',
    '--nes-accent': '#e07a5f'
  }), []);

  const handleAdventureEvent = (evt) => {
    // evt: { type, payload }
    if (evt.type === 'mode') {
      setMode(evt.payload);
      if (evt.payload === 'platform') setArea('THE ABYSSAL BRIDGE');
    }
    if (evt.type === 'xp') {
      setStats(s => ({ ...s, xp: s.xp + evt.payload }));
    }
    if (evt.type === 'hp') {
      setStats(s => ({ ...s, hp: Math.max(0, Math.min(s.maxHp, s.hp + evt.payload)) }));
    }
    if (evt.type === 'inventory:add') {
      setInventory(inv => inv.includes(evt.payload) ? inv : [...inv, evt.payload]);
    }
    if (evt.type === 'spawn:words') {
      const baseY = 180;
      const items = evt.payload.map((w, i) => ({ id: `${w}-${Date.now()}-${i}`, text: w, type: 'platform', x: 40 + i * 140, y: baseY - (i % 2) * 30 }));
      setPlatformWords(prev => {
        // merge unique by text in scene
        const existing = new Set(prev.map(p => p.text));
        const merged = [...prev];
        for (const it of items) if (!existing.has(it.text)) merged.push(it);
        return merged;
      });
      setMode('platform');
    }
    if (evt.type === 'spawn:guardian') {
      setPlatformWords(prev => [...prev, { id: `npc-${Date.now()}`, text: 'GUARDIAN', type: 'npc', x: 420, y: 150 }]);
    }
    if (evt.type === 'spawn:fear') {
      setEnemies(prev => [...prev, { id: `enm-${Date.now()}`, word: 'FEAR', x: 480, y: 130, hp: 3 }]);
      setMode('platform');
    }
    if (evt.type === 'command') {
      setPendingCommand(evt.payload);
      // small sfx
      click();
      setTimeout(() => setPendingCommand(null), 200);
    }
    if (evt.type === 'prompt') {
      setPrompt(evt.payload);
    }
  };

  const handleCombat = (enemyId) => {
    // simple RPG bump combat: player defeats FEAR in a few hits, gain XP
    setEnemies(prev => prev.map(e => e.id === enemyId ? { ...e, hp: e.hp - (1 + stats.atk) } : e));
    setStats(s => ({ ...s, hp: Math.max(0, s.hp - 1) }));
    click(220, 0.08);
  };

  useEffect(() => {
    // clean dead enemies and award XP
    const dead = enemies.filter(e => e.hp <= 0);
    if (dead.length) {
      setEnemies(prev => prev.filter(e => e.hp > 0));
      setStats(s => ({ ...s, xp: s.xp + 5 * dead.length }));
      click(1320, 0.12);
    }
  }, [enemies]);

  const onFirstInteract = () => startMusic();

  return (
    <div className="min-h-screen w-full" style={paletteVars}>
      <div className="relative h-[46vh] w-full overflow-hidden bg-[var(--nes-black)]">
        <HeroSplineCover onInteract={onFirstInteract} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#00000066] to-[var(--nes-black)]" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded border border-[var(--nes-dark)] bg-[#00000099] px-3 py-1 text-[10px] text-[var(--nes-light)] shadow-[0_0_0_2px_var(--nes-dark)_inset]">
          Press any key or click to start chiptune
        </div>
      </div>

      <HUD stats={stats} inventory={inventory} mode={mode} area={area} prompt={prompt} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 pb-10 pt-4 sm:flex-row">
        <section className="w-full sm:w-1/2">
          <TextAdventurePanel
            onEvent={handleAdventureEvent}
            inventory={inventory}
            stats={stats}
            setStats={setStats}
            setInventory={setInventory}
          />
        </section>
        <section className="w-full sm:w-1/2">
          <PlatformScene
            mode={mode}
            words={platformWords}
            enemies={enemies}
            onEnemyHit={handleCombat}
            command={pendingCommand}
          />
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-3 pb-6 text-center text-[10px] text-[var(--nes-light)]/60">
        Retro text-platformer prototype. Built with a limited palette and 8-bit vibes.
      </footer>
    </div>
  );
}
