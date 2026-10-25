
import { AudioTaskQueue } from "./audio-queue-controller";

export class AudioEngine {
  readonly context: AudioContext;
  readonly analyser: AnalyserNode;
  readonly queue: AudioTaskQueue;

  private source: AudioBufferSourceNode | null = null;
  private disposed = false;

  constructor() {
    // Create Web Audio context
    this.context = new AudioContext();

    // Configure FFT analyser
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    // Connect analyser to speakers
    this.analyser.connect(this.context.destination);

    // FIFO controller shares the same context
    this.queue = new AudioTaskQueue(this.context);
  }

  get frequencyBinCount(): number {
    return this.analyser.frequencyBinCount;
  }

  async load(url: string): Promise<AudioBuffer> {
    if (this.disposed) {
      throw new Error("Audio engine has been disposed");
    }

    return this.queue.enqueue(url);
  }

  async play(buffer: AudioBuffer): Promise<void> {
    if (this.disposed) {
      throw new Error("Audio engine has been disposed");
    }

    await this.context.resume();

    if (this.disposed) return;

    // Stop and disconnect previous source
    this.stop();

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    source.connect(this.analyser);

    source.onended = () => {
      source.disconnect();
      source.onended = null;

      if (this.source === source) {
        this.source = null;
      }
    };

    this.source = source;
    source.start();
  }

  stop(): void {
    const source = this.source;

    if (!source) return;

    this.source = null;
    source.onended = null;

    try {
      source.stop();
    } catch {
      // Ignore if source has already stopped
    }

    source.disconnect();
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;

    this.disposed = true;

    this.queue.dispose();
    this.stop();
    this.analyser.disconnect();

    if (this.context.state !== "closed") {
      await this.context.close();
    }
  }
}
