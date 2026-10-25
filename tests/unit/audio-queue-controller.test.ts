
import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioTaskQueue } from "../../lib/audio/audio-queue-controller";

function deferred<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

function mockResponse(): Response {
  return {
    ok: true,
    status: 200,
    arrayBuffer: vi.fn(async () => new ArrayBuffer(8)),
  } as unknown as Response;
}

function createQueue() {
  const buffer = { duration: 3 } as AudioBuffer;

  const decode = vi.fn(async () => buffer);

  const context = {
    decodeAudioData: decode,
  } as unknown as AudioContext;

  return {
    queue: new AudioTaskQueue(context),
    decode,
    buffer,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AudioTaskQueue", () => {
  it("processes tasks in FIFO order", async () => {
    const order: string[] = [];

    const fetchMock = vi.fn(async (url: string) => {
      order.push(url);
      return mockResponse();
    });

    vi.stubGlobal("fetch", fetchMock);

    const { queue } = createQueue();

    const results = await Promise.all([
      queue.enqueue("/track-1.mp3"),
      queue.enqueue("/track-2.mp3"),
      queue.enqueue("/track-3.mp3"),
    ]);

    expect(order).toEqual([
      "/track-1.mp3",
      "/track-2.mp3",
      "/track-3.mp3",
    ]);

    expect(results).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not start the next download while one is pending", async () => {
    const first = deferred<Response>();
    const started: string[] = [];

    const fetchMock = vi.fn((url: string) => {
      started.push(url);

      if (url === "/track-1.mp3") {
        return first.promise;
      }

      return Promise.resolve(mockResponse());
    });

    vi.stubGlobal("fetch", fetchMock);

    const { queue } = createQueue();

    const p1 = queue.enqueue("/track-1.mp3");
    const p2 = queue.enqueue("/track-2.mp3");
    const p3 = queue.enqueue("/track-3.mp3");

    expect(started).toEqual(["/track-1.mp3"]);

    first.resolve(mockResponse());

    await Promise.all([p1, p2, p3]);

    expect(started).toEqual([
      "/track-1.mp3",
      "/track-2.mp3",
      "/track-3.mp3",
    ]);
  });

  it("continues after a failed download", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce(mockResponse());

    vi.stubGlobal("fetch", fetchMock);

    const { queue } = createQueue();

    const results = await Promise.allSettled([
      queue.enqueue("/missing.mp3"),
      queue.enqueue("/valid.mp3"),
    ]);

    expect(results[0].status).toBe("rejected");
    expect(results[1].status).toBe("fulfilled");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("cancels the active fetch and pending tasks", async () => {
    const fetchMock = vi.fn(
      (_url: string, options: { signal: AbortSignal }) => {
        return new Promise<Response>((_resolve, reject) => {
          const rejectOnAbort = () => {
            reject(new DOMException("Aborted", "AbortError"));
          };

          if (options.signal.aborted) {
            rejectOnAbort();
          } else {
            options.signal.addEventListener(
              "abort",
              rejectOnAbort,
              { once: true }
            );
          }
        });
      }
    );

    vi.stubGlobal("fetch", fetchMock);

    const { queue } = createQueue();

    const p1 = queue.enqueue("/track-1.mp3");
    const p2 = queue.enqueue("/track-2.mp3");

    const resultsPromise = Promise.allSettled([p1, p2]);

    queue.cancelAll();

    const results = await resultsPromise;

    expect(results[0].status).toBe("rejected");
    expect(results[1].status).toBe("rejected");

    for (const result of results) {
      if (result.status === "rejected") {
        expect(result.reason.name).toBe("AbortError");
      }
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(queue.pendingCount).toBe(0);
  });

  it("rejects new tasks after dispose", async () => {
    vi.stubGlobal("fetch", vi.fn());

    const { queue } = createQueue();

    queue.dispose();

    await expect(
      queue.enqueue("/track-1.mp3")
    ).rejects.toThrow("Queue has been disposed");

    expect(queue.pendingCount).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("ignores decoded audio when cancelled during decoding", async () => {
    const decoding = deferred<AudioBuffer>();
    const decodeStarted = deferred<void>();

    const buffer = { duration: 3 } as AudioBuffer;

    const context = {
      decodeAudioData: vi.fn(() => {
        decodeStarted.resolve();
        return decoding.promise;
      }),
    } as unknown as AudioContext;

    vi.stubGlobal("fetch", vi.fn(async () => mockResponse()));

    const queue = new AudioTaskQueue(context);

    const task = queue.enqueue("/track-1.mp3");
    const resultPromise = Promise.allSettled([task]);

    await decodeStarted.promise;

    queue.cancelAll();

    decoding.resolve(buffer);

    const [result] = await resultPromise;

    expect(result.status).toBe("rejected");

    if (result.status === "rejected") {
      expect(result.reason.name).toBe("AbortError");
    }
  });
});
