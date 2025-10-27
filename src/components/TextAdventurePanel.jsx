import React, { useEffect, useRef, useState } from 'react';

const INITIAL_LOG = [
  'You awaken in a corridor stitched from sentences. Walls whisper verbs. Ground spells ABYSS.',
  'A TORCH rests near a rusted GATE. A silent GUARDIAN stands watch.'
];

const KEYWORDS_TO_PLATFORMS = ['ABYSS', 'BRIDGE', 'PATH', 'WORD', 'GATE'];

export default function TextAdventurePanel({ onEvent, inventory, stats, setStats, setInventory }) {
  const [log, setLog] = useState(INITIAL_LOG);
  const [input, setInput] = useState('');
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [log]);

  const append = (line) => setLog((l) => [...l, line]);

  const triggerPlatformsFromText = (text) => {
    const found = KEYWORDS_TO_PLATFORMS.filter(k => text.toUpperCase().includes(k));
    if (found.length) onEvent({ type: 'spawn:words', payload: found });
  };

  const parse = (raw) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const u = cmd.toUpperCase();

    if (u === 'LOOK') {
      append('Corridor continues. The word ABYSS yawns ahead. GUARDIAN watches.');
      triggerPlatformsFromText('ABYSS');
      return;
    }

    if (u.startsWith('TAKE ')) {
      const item = cmd.slice(5).trim();
      if (!item) { append('Take what?'); return; }
      if (inventory.includes(item.toUpperCase())) { append(`You already have the ${item}.`); return; }
      setInventory((inv) => [...inv, item.toUpperCase()]);
      onEvent({ type: 'xp', payload: 1 });
      append(`You take the ${item}.`);
      if (item.toUpperCase() === 'TORCH') {
        append('Light blooms. Words casting shadows become platforms.');
        onEvent({ type: 'spawn:words', payload: ['BRIDGE', 'WORD'] });
      }
      return;
    }

    if (u.startsWith('USE ')) {
      const item = cmd.slice(4).trim().toUpperCase();
      if (!inventory.includes(item)) { append(`You do not have ${item}.`); return; }
      if (item === 'TORCH') {
        append('You raise the TORCH. Letters glow.');
        onEvent({ type: 'spawn:words', payload: ['PATH'] });
        return;
      }
      if (item === 'KEY') {
        append('You grip the KEY, its teeth like tiny ladders.');
        return;
      }
      append(`You use the ${item}, but nothing obvious happens.`);
      return;
    }

    if (u === 'OPEN') {
      if (inventory.includes('KEY')) {
        append('KEY clicks. The GATE word unfurls into a walkway.');
        onEvent({ type: 'spawn:words', payload: ['GATE'] });
        onEvent({ type: 'xp', payload: 3 });
      } else {
        append('The GATE remains a stubborn noun. You might need a KEY.');
      }
      return;
    }

    if (u === 'TALK GUARDIAN') {
      append('GUARDIAN: "Leap when words align. Confront FEAR to level up."');
      onEvent({ type: 'spawn:guardian' });
      return;
    }

    if (u === 'FIGHT FEAR') {
      append('You summon the word FEAR. It snarls into pixels.');
      onEvent({ type: 'spawn:fear' });
      return;
    }

    if (u === 'JUMP') {
      append('You prepare to jump.');
      onEvent({ type: 'command', payload: 'JUMP' });
      onEvent({ type: 'mode', payload: 'platform' });
      return;
    }

    // Movement keywords cause mode shift
    if (u === 'BEGIN' || u === 'RUN' || u === 'GO') {
      append('Words begin to solidify underfoot.');
      onEvent({ type: 'mode', payload: 'platform' });
      onEvent({ type: 'spawn:words', payload: ['ABYSS'] });
      return;
    }

    // Basic health interaction
    if (u === 'REST') {
      const healed = Math.min(stats.maxHp - stats.hp, 2);
      if (healed > 0) {
        onEvent({ type: 'hp', payload: healed });
        append('You rest among the commas. You feel better.');
      } else {
        append('You are already at full vitality.');
      }
      return;
    }

    append(`Unrecognized command: ${cmd}`);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLog((l) => [...l, `> ${input}`]);
    parse(input);
    setInput('');
  };

  return (
    <div className="rounded border border-[var(--nes-dark)] bg-[var(--nes-black)] p-2 text-[var(--nes-light)] shadow-[0_0_0_2px_var(--nes-dark)_inset]">
      <div ref={feedRef} className="h-64 overflow-y-auto whitespace-pre-line text-[12px] leading-relaxed">
        {log.map((line, i) => (
          <div key={i} className="mb-1">
            {line}
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-2 flex items-center gap-2">
        <input
          className="flex-1 rounded border border-[var(--nes-dark)] bg-[var(--nes-deep)] px-2 py-1 text-[12px] text-[var(--nes-light)] outline-none placeholder:text-[var(--nes-light)]/40"
          placeholder="Type commands: LOOK, TAKE TORCH, USE TORCH, OPEN, TALK GUARDIAN, FIGHT FEAR, JUMP, REST"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoCorrect="off"
          autoCapitalize="characters"
        />
        <button className="rounded border border-[var(--nes-dark)] bg-[var(--nes-deep)] px-3 py-1 text-[11px]">
          ENTER
        </button>
      </form>
    </div>
  );
}
