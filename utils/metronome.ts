
import * as Tone from 'tone';

export class Metronome {
  private bpm: number;
  public isPlaying: boolean;
  private click: Tone.MembraneSynth;
  private loop: Tone.Loop;
  private onTick?: (index: number) => void;
  private tickCount: number = 0;

  constructor(bpm: number = 80, onTick?: (index: number) => void) {
    this.bpm = bpm;
    this.isPlaying = false;
    this.onTick = onTick;
    
    this.click = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0
      }
    }).toDestination();
    
    // O loop roda em colcheias (8n) para bater com os 8 slots do RhythmPlayer
    this.loop = new Tone.Loop((time) => {
      // Toca o som apenas nas semínimas (4n) para o metrônomo tradicional,
      // mas o loop detecta cada slot visual
      if (this.tickCount % 2 === 0) {
        this.click.triggerAttackRelease('C5', '16n', time);
      }
      
      Tone.Draw.schedule(() => {
        if (this.onTick) {
          this.onTick(this.tickCount % 8);
        }
        this.tickCount++;
      }, time);
    }, '8n');
  }

  start() {
    this.tickCount = 0;
    Tone.Transport.bpm.value = this.bpm;
    Tone.Transport.start();
    this.loop.start(0);
    this.isPlaying = true;
  }

  stop() {
    Tone.Transport.stop();
    this.loop.stop();
    this.isPlaying = false;
    this.tickCount = 0;
  }

  setBpm(newBpm: number) {
    this.bpm = newBpm;
    Tone.Transport.bpm.value = newBpm;
  }

  dispose() {
    this.loop.dispose();
    this.click.dispose();
  }
}
