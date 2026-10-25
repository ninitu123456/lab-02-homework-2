
interface AudioTask {
  trackUrl: string;
  controller: AbortController;
  resolve: (buffer: AudioBuffer) => void;
  reject: (error: Error) => void;
}

function createAbortError(): Error {
  return new DOMException("Audio task cancelled", "AbortError");
}

export class AudioTaskQueue {
  private queue: AudioTask[] = [];
  private isProcessing = false;
  private activeController: AbortController | null = null;
  private disposed = false;

  constructor(private readonly audioContext: AudioContext) {}

  get pendingCount(): number {
    return this.queue.length;
  }

  get processing(): boolean {
    return this.isProcessing;
  }

  enqueue(trackUrl: string): Promise<AudioBuffer> {
    if (this.disposed) {
      return Promise.reject(new Error("Queue has been disposed"));
    }

    const controller = new AbortController();

    return new Promise<AudioBuffer>((resolve, reject) => {
      this.queue.push({
        trackUrl,
        controller,
        resolve,
        reject,
      });

      void this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.disposed) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0 && !this.disposed) {
        const task = this.queue.shift()!;

        this.activeController = task.controller;

        try {
          if (task.controller.signal.aborted) {
            throw createAbortError();
          }

          const response = await fetch(task.trackUrl, {
            signal: task.controller.signal,
          });

          if (!response.ok) {
            throw new Error(
              `Failed to download audio: ${response.status}`
            );
          }

          const arrayBuffer = await response.arrayBuffer();

          if (task.controller.signal.aborted) {
            throw createAbortError();
          }

          const audioBuffer =
            await this.audioContext.decodeAudioData(arrayBuffer);

          if (task.controller.signal.aborted || this.disposed) {
            throw createAbortError();
          }

          task.resolve(audioBuffer);
        } catch (error) {
          task.reject(
            task.controller.signal.aborted
              ? createAbortError()
              : error instanceof Error
                ? error
                : new Error(String(error))
          );
        } finally {
          if (this.activeController === task.controller) {
            this.activeController = null;
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  cancelAll(): void {
    this.activeController?.abort();

    for (const task of this.queue) {
      task.controller.abort();
      task.reject(createAbortError());
    }

    this.queue = [];
  }

  dispose(): void {
    if (this.disposed) return;

    this.disposed = true;
    this.cancelAll();
  }
}
