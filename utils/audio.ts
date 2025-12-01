
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

      case Skin.Celestia:
        // Divine Crystal/Bell Sound
        // Primary tone - High frequency Sine for purity
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 1.0); // Sustain pitch
        
        // High pass filter to remove muddiness
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.02); // Soft attack
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5); // Long crystalline tail
        
        osc.start(t);
        osc.stop(t + 1.5);

        // Overtone for "Glass" character (non-integer harmonic)
        const glassOsc = this.ctx.createOscillator();
        const glassGain = this.ctx.createGain();
        glassOsc.connect(glassGain);
        glassGain.connect(this.ctx.destination);
        
        glassOsc.type = 'sine';
        glassOsc.frequency.setValueAtTime(1200 * 2.6, t); // Inharmonic
        glassGain.gain.setValueAtTime(0.1, t);
        glassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        glassOsc.start(t);
        glassOsc.stop(t + 0.8);

        // Initial impact click (hard object hitting glass)
        const impact = this.ctx.createOscillator();
        const impactGain = this.ctx.createGain();
        impact.connect(impactGain);
        impactGain.connect(this.ctx.destination);
        impact.type = 'triangle';
        impact.frequency.setValueAtTime(4000, t);
        impactGain.gain.setValueAtTime(0.1, t);
        impactGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        impact.start(t);
        impact.stop(t + 0.05);
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

  public playSkinTransition(skin: Skin) {
    if (!this.enabled || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    
    const masterGain = this.ctx.createGain();
    masterGain.connect(this.ctx.destination);
    masterGain.gain.setValueAtTime(0.3, t);

    if (skin === Skin.Celestia) {
        // Divine Ascension Sound - Swelling Angelic Choir
        const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C Major spread
        freqs.forEach((f, i) => {
            const osc = this.ctx!.createOscillator();
            const g = this.ctx!.createGain();
            osc.connect(g);
            g.connect(masterGain);
            
            // Mix sine and triangle for a "voice-like" quality
            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(f, t);
            
            // Slow swell
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.08, t + 1.0); // Peak at 1s
            g.gain.exponentialRampToValueAtTime(0.001, t + 4.0); // Long decay
            
            // Subtle vibrato
            const vib = this.ctx!.createOscillator();
            const vibGain = this.ctx!.createGain();
            vib.connect(vibGain);
            vibGain.connect(osc.frequency);
            vib.frequency.value = 4 + Math.random(); // 4-5Hz vibrato
            vibGain.gain.value = 3; // +/- 3Hz pitch shift
            vib.start(t);
            vib.stop(t + 4.0);

            osc.start(t);
            osc.stop(t + 4.0);
        });
        
        // Ethereal Wind / Shine
        const noiseBuffer = this.createNoiseBuffer();
        if (noiseBuffer) {
            const noiseSrc = this.ctx.createBufferSource();
            const noiseFilter = this.ctx.createBiquadFilter();
            const noiseGain = this.ctx.createGain();
            
            noiseSrc.buffer = noiseBuffer;
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(800, t);
            noiseFilter.frequency.linearRampToValueAtTime(2000, t + 2); // Filter sweep up
            
            noiseSrc.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(masterGain);
            
            noiseGain.gain.setValueAtTime(0, t);
            noiseGain.gain.linearRampToValueAtTime(0.1, t + 1.5);
            noiseGain.gain.linearRampToValueAtTime(0, t + 3.0);
            
            noiseSrc.start(t);
            noiseSrc.stop(t + 3.0);
        }
        
    } else if (skin === Skin.Dragon) {
        // Deep Rumble
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 1.5);
        
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 2);
        
        osc.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 2);
    } else {
        // Standard Whoosh
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.5);
        
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        
        osc.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.5);
    }
  }

  private createNoiseBuffer() {
      if (!this.ctx) return null;
      const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }
      return buffer;
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
