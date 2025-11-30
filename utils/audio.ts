
import { Skin } from '../types';

class AudioController {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    try {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    } catch (e) {
      console.error("Web Audio API not supported");
    }
  }

  private init() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggle(state: boolean) {
    this.enabled = state;
    if (state) this.init();
  }

  // Generate a sound based on material physics simulation
  public playStone(skin: Skin) {
    if (!this.enabled || !this.ctx) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    // Material Physics Configuration
    switch (skin) {
      case Skin.Classic: // Wood
      case Skin.Forest:
      case Skin.Sunset:
      case Skin.Ink:
        // Short, thuddy, low resonance
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
        
        // Add a secondary "click" for stone impact
        const click = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        click.connect(clickGain);
        clickGain.connect(this.ctx.destination);
        click.type = 'square';
        click.frequency.setValueAtTime(2000, t);
        clickGain.gain.setValueAtTime(0.1, t);
        clickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        click.start(t);
        click.stop(t + 0.05);
        break;

      case Skin.Ocean: // Glass/Water
      case Skin.Glacier:
      case Skin.Sakura:
        // High pitch, clear ringing, longer decay
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.3);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.5);
        break;

      case Skin.Cyber: // Digital
      case Skin.Nebula:
        // FM Synthesis / Laser-like
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.2);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.Q.value = 10;
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
        break;

      case Skin.Alchemy: // Metal/Steampunk
        // Metallic clank + Gear tick
        osc.type = 'square'; // Harmonic rich
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
        
        filter.type = 'bandpass'; // Metallic resonance
        filter.frequency.setValueAtTime(800, t);
        filter.Q.value = 5;

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        
        osc.start(t);
        osc.stop(t + 0.25);

        // Gear click
        const gear = this.ctx.createOscillator();
        const gearGain = this.ctx.createGain();
        gear.connect(gearGain);
        gearGain.connect(this.ctx.destination);
        gear.type = 'sawtooth';
        gear.frequency.setValueAtTime(2500, t);
        gearGain.gain.setValueAtTime(0.15, t);
        gearGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        gear.start(t);
        gear.stop(t + 0.05);
        break;

      case Skin.Aurora: // Ethereal/Space
        // Soft sine sweep + shimmer
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, t); // High start
        osc.frequency.linearRampToValueAtTime(500, t + 0.4); // Glide down
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, t);
        
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6); // Long tail
        
        osc.start(t);
        osc.stop(t + 0.6);
        
        // Detuned layer for "shimmer"
        const shimmer = this.ctx.createOscillator();
        const shimmerGain = this.ctx.createGain();
        shimmer.connect(shimmerGain);
        shimmerGain.connect(this.ctx.destination);
        shimmer.type = 'triangle';
        shimmer.frequency.setValueAtTime(1005, t);
        shimmer.frequency.linearRampToValueAtTime(505, t + 0.4);
        shimmerGain.gain.setValueAtTime(0.1, t);
        shimmerGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        shimmer.start(t);
        shimmer.stop(t + 0.6);
        break;

      case Skin.Dragon: // Heavy Stone/Metal
        // Deep impact + metallic ring
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, t);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
    }
  }

  public playWin() {
    if (!this.enabled || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    
    // Major Chord Arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const start = t + i * 0.1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 2);
      
      osc.start(start);
      osc.stop(start + 2);
    });
  }

  public playLoss() {
    if (!this.enabled || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(50, t + 1);
    
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0, t + 1);
    
    osc.start(t);
    osc.stop(t + 1);
  }

  public playUI(type: 'click' | 'hover') {
    if (!this.enabled || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }
}

export const audioController = new AudioController();
