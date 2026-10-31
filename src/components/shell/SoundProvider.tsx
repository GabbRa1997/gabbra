"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type Cue = "shutter" | "whoosh" | "thud" | "tick";

interface SoundApi {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  toggle: () => void;
  cue: (c: Cue) => void;
}

const SoundCtx = createContext<SoundApi>({
  enabled: false,
  setEnabled() {},
  toggle() {},
  cue() {},
});

export const useSound = () => useContext(SoundCtx);

/**
 * Generative ambience: no audio files, so nothing to download and nothing to
 * license. A low drone with slow filter movement, plus short UI cues.
 */
class Engine {
  ctx: AudioContext;
  master: GainNode;
  cues: GainNode;
  noise: AudioBuffer;
  started = false;

  constructor() {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
    this.cues = this.ctx.createGain();
    this.cues.gain.value = 0.22;
    this.cues.connect(this.ctx.destination);
    this.noise = this.makeNoise();
  }

  private makeNoise() {
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  private startDrone() {
    if (this.started) return;
    this.started = true;
    const c = this.ctx;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    lp.connect(this.master);

    const voices: [number, number, OscillatorType][] = [
      [49, 0.35, "sine"],
      [49.7, 0.35, "sine"],
      [98.4, 0.08, "triangle"],
      [73.5, 0.12, "sine"],
    ];
    for (const [f, g, t] of voices) {
      const o = c.createOscillator();
      o.type = t;
      o.frequency.value = f;
      const gn = c.createGain();
      gn.gain.value = g;
      o.connect(gn).connect(lp);
      o.start();
    }

    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 700;
    bp.Q.value = 0.6;
    const ng = c.createGain();
    ng.gain.value = 0.045;
    src.connect(bp).connect(ng).connect(this.master);
    src.start();

    const lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const lg = c.createGain();
    lg.gain.value = 260;
    lfo.connect(lg).connect(bp.frequency);
    lfo.start();

    const lfo2 = c.createOscillator();
    lfo2.frequency.value = 0.05;
    const lg2 = c.createGain();
    lg2.gain.value = 120;
    lfo2.connect(lg2).connect(lp.frequency);
    lfo2.start();
  }

  async on() {
    await this.ctx.resume();
    this.startDrone();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0.13, t, 0.9);
  }

  off() {
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, 0.15);
    window.setTimeout(() => {
      if (this.master.gain.value < 0.01) void this.ctx.suspend();
    }, 900);
  }

  private burst(
    type: BiquadFilterType,
    from: number,
    to: number,
    dur: number,
    peak: number,
    at = 0,
  ) {
    const c = this.ctx;
    const t0 = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = type;
    f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, t0);
    f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + dur * 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.cues);
    src.start(t0, Math.random());
    src.stop(t0 + dur + 0.05);
  }

  private thump(freq: number, dur: number, peak: number, at = 0) {
    const c = this.ctx;
    const t0 = c.currentTime + at;
    const o = c.createOscillator();
    o.frequency.setValueAtTime(freq * 2, t0);
    o.frequency.exponentialRampToValueAtTime(freq, t0 + dur * 0.4);
    const g = c.createGain();
    g.gain.setValueAtTime(peak, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.cues);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  cue(kind: Cue) {
    if (this.ctx.state !== "running") return;
    switch (kind) {
      case "shutter":
        this.burst("highpass", 3000, 6000, 0.05, 1.4);
        this.thump(130, 0.09, 0.8);
        this.burst("highpass", 2500, 5000, 0.05, 1.1, 0.085);
        break;
      case "whoosh":
        this.burst("bandpass", 250, 3500, 0.7, 1.6);
        break;
      case "thud":
        this.thump(55, 0.6, 1.2);
        this.burst("lowpass", 400, 80, 0.5, 0.6);
        break;
      case "tick":
        this.burst("highpass", 4000, 7000, 0.03, 0.7);
        break;
    }
  }
}

export default function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const engine = useRef<Engine | null>(null);

  const start = useCallback(() => {
    try {
      engine.current ??= new Engine();
      void engine.current.on();
    } catch {
      /* audio unavailable — stay silent */
    }
  }, []);

  const setEnabled = useCallback(
    (v: boolean) => {
      setEnabledState(v);
      try {
        localStorage.setItem("gabbra:sound", v ? "on" : "off");
      } catch {}
      if (v) start();
      else engine.current?.off();
    },
    [start],
  );

  // A returning visitor who left sound on: arm it, and start on first gesture
  // (browsers refuse to play audio before the visitor interacts).
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("gabbra:sound");
    } catch {}
    if (saved !== "on") return;
    setEnabledState(true);
    const go = () => {
      start();
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
    };
    window.addEventListener("pointerdown", go);
    window.addEventListener("keydown", go);
    return () => {
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
    };
  }, [start]);

  const cue = useCallback((c: Cue) => engine.current?.cue(c), []);
  const toggle = useCallback(() => setEnabled(!enabled), [enabled, setEnabled]);

  const value = useMemo(
    () => ({ enabled, setEnabled, toggle, cue }),
    [enabled, setEnabled, toggle, cue],
  );
  return <SoundCtx.Provider value={value}>{children}</SoundCtx.Provider>;
}
