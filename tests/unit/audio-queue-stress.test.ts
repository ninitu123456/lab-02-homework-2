
import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioTaskQueue } from "../../lib/audio/audio-queue-controller";

const TOTAL_TASKS = 100;

function createResponse(): Response {
  return {
    ok: true,
    status: 200,
    arrayBuffer: async () => new ArrayBuffer(8),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AudioTaskQueue stress testing", () => {
  it("processes 100 tasks in FIFO order", async () => {
    const order: string[] = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        order.push(url);
        return createResponse();
      })
    );

    const context = {
      decodeAudioData: vi.fn(async () => ({
        duration: 3,
      })),
    } as unknown as AudioContext;

    const queue = new AudioTaskQueue(context);

    const urls = Array.from(
      { length: TOTAL_TASKS },
      (_, i) => `/track-${i}.mp3`
    );

    const results = await Promise.all(
      urls.map((url) => queue.enqueue(url))
    );

    expect(order).toEqual(urls);
    expect(results).toHaveLength(TOTAL_TASKS);
    expect(queue.pendingCount).toBe(0);
    expect(queue.processing).toBe(false);
  });

  it("never exceeds one active download/decode task", async () => {
    let active = 0;
    let maxActive = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        active++;
        maxActive = Math.max(maxActive, active);

        await new Promise<void>((resolve) =>
          setTimeout(resolve, 1)
        );

        return createResponse();
      })
    );

    const context = {
      decodeAudioData: vi.fn(async () => {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, 1)
        );

        active--;

        return { duration: 3 } as AudioBuffer;
      }),
    } as unknown as AudioContext;

    const queue = new AudioTaskQueue(context);

    await Promise.all(
      Array.from({ length: TOTAL_TASKS }, (_, i) =>
        queue.enqueue(`/track-${i}.mp3`)
      )
    );

    expect(maxActive).toBe(1);
    expect(active).toBe(0);
    expect(queue.processing).toBe(false);
  });

  it("continues after intermittent download failures", async () => {
    let callCount = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        callCount++;

        if (callCount % 10 === 0) {
          return {
            ok: false,
            status: 503,
          } as Response;
        }

        return createResponse();
      })
    );

    const context = {
      decodeAudioData: vi.fn(async () => ({
        duration: 3,
      })),
    } as unknown as AudioContext;

    const queue = new AudioTaskQueue(context);

    const results = await Promise.allSettled(
      Array.from({ length: TOTAL_TASKS }, (_, i) =>
        queue.enqueue(`/track-${i}.mp3`)
      )
    );

    expect(
      results.filter((r) => r.status === "fulfilled")
    ).toHaveLength(90);

    expect(
      results.filter((r) => r.status === "rejected")
    ).toHaveLength(10);

    expect(queue.pendingCount).toBe(0);
    expect(queue.processing).toBe(false);
  });
});
