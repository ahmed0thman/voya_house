"use client";

import { useRef, useState, useCallback, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SoundLayer {
  /** Human-readable label */
  name: string;
  /** Scroll range where this layer is active [start, end] (0-1) */
  range: [number, number];
  /** Nodes that produce the sound — created lazily */
  nodes: AudioNode[];
  /** Master gain for this layer */
  gain: GainNode | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Create a looping noise buffer (white/brown/pink noise source) */
function createNoiseBuffer(
  ctx: AudioContext,
  type: "white" | "brown" | "pink",
  durationSec = 2,
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * durationSec;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  if (type === "white") {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === "brown") {
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  } else {
    // Pink noise (Voss-McCartney approximation)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }

  return buffer;
}

function createNoiseSource(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.start();
  return source;
}

// ─── Layer Builders ─────────────────────────────────────────────────────────────

/**
 * COFFEE (0.4 – 0.6): Steam + crackling + warm brown noise
 */
function buildCoffeeLayer(ctx: AudioContext, masterGain: GainNode): AudioNode[] {
  // Steam hiss — high-passed white noise
  const steamBuffer = createNoiseBuffer(ctx, "white", 2);
  const steamSource = createNoiseSource(ctx, steamBuffer);
  const steamHP = ctx.createBiquadFilter();
  steamHP.type = "highpass";
  steamHP.frequency.value = 3000;
  steamHP.Q.value = 0.7;
  const steamGain = ctx.createGain();
  steamGain.gain.value = 0.04;

  // LFO to modulate the steam intensity (pulsing hiss)
  const steamLfo = ctx.createOscillator();
  steamLfo.type = "sine";
  steamLfo.frequency.value = 0.3;
  const steamLfoGain = ctx.createGain();
  steamLfoGain.gain.value = 0.02;
  steamLfo.connect(steamLfoGain);
  steamLfoGain.connect(steamGain.gain);
  steamLfo.start();

  steamSource.connect(steamHP);
  steamHP.connect(steamGain);
  steamGain.connect(masterGain);

  // Crackling — shaped pink noise with sharp bandpass
  const crackleBuffer = createNoiseBuffer(ctx, "pink", 2);
  const crackleSource = createNoiseSource(ctx, crackleBuffer);
  const crackleBP = ctx.createBiquadFilter();
  crackleBP.type = "bandpass";
  crackleBP.frequency.value = 2500;
  crackleBP.Q.value = 3;
  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.025;

  crackleSource.connect(crackleBP);
  crackleBP.connect(crackleGain);
  crackleGain.connect(masterGain);

  // Warm undertone — brown noise
  const warmBuffer = createNoiseBuffer(ctx, "brown", 3);
  const warmSource = createNoiseSource(ctx, warmBuffer);
  const warmLP = ctx.createBiquadFilter();
  warmLP.type = "lowpass";
  warmLP.frequency.value = 250;
  const warmGain = ctx.createGain();
  warmGain.gain.value = 0.08;

  warmSource.connect(warmLP);
  warmLP.connect(warmGain);
  warmGain.connect(masterGain);

  return [
    steamSource, steamHP, steamGain, steamLfo, steamLfoGain,
    crackleSource, crackleBP, crackleGain,
    warmSource, warmLP, warmGain,
  ];
}

/**
 * PAPA VOYA (0.6 – 0.8): Nature — breeze + birdsong-like tones
 */
function buildPapaLayer(ctx: AudioContext, masterGain: GainNode): AudioNode[] {
  // Deep simmering sound — low-pass filtered pink noise
  const simmerBuffer = createNoiseBuffer(ctx, "pink", 3);
  const simmerSource = createNoiseSource(ctx, simmerBuffer);
  const simmerLP = ctx.createBiquadFilter();
  simmerLP.type = "lowpass";
  simmerLP.frequency.value = 450;
  simmerLP.Q.value = 1.2;
  const simmerGain = ctx.createGain();
  simmerGain.gain.value = 0.1; // Increased by 25% (was 0.08)

  // LFO for bubbling/simmering rhythm
  const simmerLfo = ctx.createOscillator();
  simmerLfo.type = "sine";
  simmerLfo.frequency.value = 2.5; // Bubble speed
  const simmerLfoGain = ctx.createGain();
  simmerLfoGain.gain.value = 50; 
  simmerLfo.connect(simmerLfoGain);
  simmerLfoGain.connect(simmerLP.frequency);
  simmerLfo.start();

  simmerSource.connect(simmerLP);
  simmerLP.connect(simmerGain);
  simmerGain.connect(masterGain);

  // Soft sizzle/crackle (like pan frying) — high-pass brown noise
  const crackleBuffer = createNoiseBuffer(ctx, "brown", 2);
  const crackleSource = createNoiseSource(ctx, crackleBuffer);
  const crackleHP = ctx.createBiquadFilter();
  crackleHP.type = "highpass";
  crackleHP.frequency.value = 3500;
  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.044; // Increased by ~25% (was 0.035)

  crackleSource.connect(crackleHP);
  crackleHP.connect(crackleGain);
  crackleGain.connect(masterGain);

  // Subdued warmth drone to tie it with the other cooking sections
  const warmOsc = ctx.createOscillator();
  warmOsc.type = "sine";
  warmOsc.frequency.value = 110;
  const warmGain = ctx.createGain();
  warmGain.gain.value = 0.0625; // Increased by 25% (was 0.05)
  warmOsc.start();
  warmOsc.connect(warmGain);
  warmGain.connect(masterGain);

  return [
    simmerSource, simmerLP, simmerGain, simmerLfo, simmerLfoGain,
    crackleSource, crackleHP, crackleGain,
    warmOsc, warmGain
  ];
}

/**
 * MAMA VOYA (0.8 – 1.0): Kitchen warmth — sizzle + low warmth
 */
function buildMamaLayer(ctx: AudioContext, masterGain: GainNode): AudioNode[] {
  // Sizzle — filtered white noise with character
  const sizzleBuffer = createNoiseBuffer(ctx, "white", 2);
  const sizzleSource = createNoiseSource(ctx, sizzleBuffer);
  const sizzleBP = ctx.createBiquadFilter();
  sizzleBP.type = "bandpass";
  sizzleBP.frequency.value = 5500;
  sizzleBP.Q.value = 1.5;
  const sizzleGain = ctx.createGain();
  sizzleGain.gain.value = 0.03;

  // Sizzle modulation
  const sizzleLfo = ctx.createOscillator();
  sizzleLfo.type = "sine";
  sizzleLfo.frequency.value = 0.4;
  const sizzleLfoGain = ctx.createGain();
  sizzleLfoGain.gain.value = 0.015;
  sizzleLfo.connect(sizzleLfoGain);
  sizzleLfoGain.connect(sizzleGain.gain);
  sizzleLfo.start();

  sizzleSource.connect(sizzleBP);
  sizzleBP.connect(sizzleGain);
  sizzleGain.connect(masterGain);

  // Warm low-end hum (kitchen appliance warmth)
  const warmOsc = ctx.createOscillator();
  warmOsc.type = "sine";
  warmOsc.frequency.value = 60;
  const warmOscGain = ctx.createGain();
  warmOscGain.gain.value = 0.06;

  const warmLP = ctx.createBiquadFilter();
  warmLP.type = "lowpass";
  warmLP.frequency.value = 150;

  warmOsc.connect(warmOscGain);
  warmOscGain.connect(warmLP);
  warmLP.connect(masterGain);
  warmOsc.start();

  // Additional brown noise blanket
  const warmNoiseBuffer = createNoiseBuffer(ctx, "brown", 3);
  const warmNoiseSource = createNoiseSource(ctx, warmNoiseBuffer);
  const warmNoiseLP = ctx.createBiquadFilter();
  warmNoiseLP.type = "lowpass";
  warmNoiseLP.frequency.value = 350;
  const warmNoiseGain = ctx.createGain();
  warmNoiseGain.gain.value = 0.06;

  warmNoiseSource.connect(warmNoiseLP);
  warmNoiseLP.connect(warmNoiseGain);
  warmNoiseGain.connect(masterGain);

  // Gentle crackling (pan/pot)
  const crackleBuffer = createNoiseBuffer(ctx, "pink", 2);
  const crackleSource = createNoiseSource(ctx, crackleBuffer);
  const crackleBP = ctx.createBiquadFilter();
  crackleBP.type = "bandpass";
  crackleBP.frequency.value = 3500;
  crackleBP.Q.value = 2;
  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.02;

  crackleSource.connect(crackleBP);
  crackleBP.connect(crackleGain);
  crackleGain.connect(masterGain);

  return [
    sizzleSource, sizzleBP, sizzleGain, sizzleLfo, sizzleLfoGain,
    warmOsc, warmOscGain, warmLP,
    warmNoiseSource, warmNoiseLP, warmNoiseGain,
    crackleSource, crackleBP, crackleGain,
  ];
}

// ─── The Hook ───────────────────────────────────────────────────────────────────

const LAYER_DEFS: { name: string; range: [number, number]; build: (ctx: AudioContext, gain: GainNode) => AudioNode[] }[] = [
  { name: "coffee", range: [0.4,  0.6],  build: buildCoffeeLayer },
  { name: "papa",   range: [0.6,  0.8],  build: buildPapaLayer },
  { name: "mama",   range: [0.8,  1.0],  build: buildMamaLayer },
];

/** Volume for the always-on vocal layer (on top of master) */
const VOCAL_VOLUME = 0.3;

/** Crossfade envelope width (in scroll-progress units) */
const FADE_WIDTH = 0.06;

export function useAmbientSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const layersRef = useRef<SoundLayer[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);
  const vocalGainRef = useRef<GainNode | null>(null);
  const vocalBufferRef = useRef<ArrayBuffer | null>(null);
  const vocalSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const initializedRef = useRef(false);
  const isMutedRef = useRef(true);
  const isDuckedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    fetch("/assets/audio/ambient_vocal.m4a")
      .then((r) => r.arrayBuffer())
      .then((buf) => { vocalBufferRef.current = buf; })
      .catch(() => { /* file missing — vocal track silently skipped */ });
  }, []);

  const initialize = useCallback(() => {
    if (initializedRef.current) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.15;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    const vocalGain = ctx.createGain();
    vocalGain.gain.value = 0;
    vocalGain.connect(ctx.destination);
    vocalGainRef.current = vocalGain;

    const rawBuffer = vocalBufferRef.current;
    if (rawBuffer) {
      ctx.decodeAudioData(rawBuffer.slice(0))
        .then((audioBuffer) => {
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.loop = true;
          source.connect(vocalGain);
          source.start();
          vocalSourceRef.current = source;
          vocalGain.gain.setValueAtTime(0, ctx.currentTime);
          vocalGain.gain.linearRampToValueAtTime(VOCAL_VOLUME, ctx.currentTime + 2.5);
        })
        .catch(() => { /* codec not supported or file missing */ });
    }

    const layers: SoundLayer[] = LAYER_DEFS.map((def) => {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(master);
      const nodes = def.build(ctx, gain);
      return { name: def.name, range: def.range, nodes, gain };
    });

    layersRef.current = layers;
    initializedRef.current = true;
  }, []);

  const toggleMute = useCallback(() => {
    if (!initializedRef.current) {
      initialize();
    }

    const ctx = ctxRef.current;
    if (!ctx) return;

    const nowMuted = isMutedRef.current;

    if (nowMuted) {
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const master = masterGainRef.current;
      if (master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0.15, ctx.currentTime, 0.1);
      }
      const vocalGain = vocalGainRef.current;
      if (vocalGain) {
        vocalGain.gain.cancelScheduledValues(ctx.currentTime);
        vocalGain.gain.setTargetAtTime(VOCAL_VOLUME, ctx.currentTime, 0.3);
      }
      isMutedRef.current = false;
      setIsMuted(false);
    } else {
      const master = masterGainRef.current;
      if (master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      }
      const vocalGain = vocalGainRef.current;
      if (vocalGain) {
        vocalGain.gain.cancelScheduledValues(ctx.currentTime);
        vocalGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      }
      isMutedRef.current = true;
      setIsMuted(true);
    }
  }, [initialize]);

  const enableSound = useCallback(() => {
    if (!initializedRef.current) {
      initialize();
    }
    
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    // Only unmute if currently muted (prevents re-triggering logic)
    if (isMutedRef.current) {
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const master = masterGainRef.current;
      if (master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0.15, ctx.currentTime, 0.1);
      }
      const vocalGain = vocalGainRef.current;
      if (vocalGain) {
        vocalGain.gain.cancelScheduledValues(ctx.currentTime);
        vocalGain.gain.setTargetAtTime(VOCAL_VOLUME, ctx.currentTime, 0.3);
      }
      isMutedRef.current = false;
      setIsMuted(false);
    }
  }, [initialize]);

  const updateProgress = useCallback((progress: number) => {
    if (!initializedRef.current || isMutedRef.current) return;

    const ctx = ctxRef.current;
    if (!ctx) return;

    const master = masterGainRef.current;
    if (master && !isDuckedRef.current && master.gain.value < 0.14) {
      master.gain.setTargetAtTime(0.15, ctx.currentTime, 0.05);
    }

    const layers = layersRef.current;
    for (const layer of layers) {
      if (!layer.gain) continue;

      const [start, end] = layer.range;
      let volume = 0;

      if (progress >= start && progress <= end) {
        volume = 1;
        if (progress < start + FADE_WIDTH) {
          volume = (progress - start) / FADE_WIDTH;
        }
        if (progress > end - FADE_WIDTH) {
          volume = (end - progress) / FADE_WIDTH;
        }
      } else if (progress > end && progress < end + FADE_WIDTH) {
        volume = Math.max(0, 1 - (progress - end) / FADE_WIDTH);
      }

      volume = Math.max(0, Math.min(1, volume));
      layer.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
    }
  }, []);

  const setDucked = useCallback((ducked: boolean) => {
    isDuckedRef.current = ducked;
    if (!initializedRef.current || isMutedRef.current) return;
    
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (ctx && master) {
      // Smoothly fade to a much lower volume (0.035) or back to 100% (0.15) over 0.5 seconds
      master.gain.setTargetAtTime(ducked ? 0.035 : 0.15, ctx.currentTime, 0.5);
    }
  }, []);

  const cleanup = useCallback(() => {
    try {
      vocalSourceRef.current?.stop();
      vocalSourceRef.current?.disconnect();
    } catch { /* already stopped */ }
    vocalSourceRef.current = null;

    for (const layer of layersRef.current) {
      for (const node of layer.nodes) {
        try {
          if ("stop" in node) (node as AudioBufferSourceNode | OscillatorNode).stop();
          node.disconnect();
        } catch { /* already stopped */ }
      }
    }
    layersRef.current = [];

    const ctx = ctxRef.current;
    if (ctx && ctx.state !== "closed") ctx.close();
    ctxRef.current = null;
    initializedRef.current = false;
  }, []);

  return {
    isMuted,
    toggleMute,
    enableSound,
    updateProgress,
    setDucked,
    cleanup,
  };
}
