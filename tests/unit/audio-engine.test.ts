
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioEngine } from "../../lib/audio/audio-engine";

type MockSource = {
  buffer: AudioBuffer | null;
  onended: (() => void) | null;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
};

let sources: MockSource[];
let contextClose: ReturnType<typeof vi.fn>;
let analyserDisconnect: ReturnType<typeof vi.fn>;

function createMockSource(): MockSource {
  const source: MockSource = {
    buffer: null,
    onended: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };

  sources.push(source);
  return source;
}

beforeEach(() => {
  sources = [];
  contextClose = vi.fn(async () => {});
  analyserDisconnect = vi.fn();

  class MockAudioContext {
    state = "running";
    destination = {};

    resume = vi.fn(async () => {});
    close = contextClose;

    createAnalyser = vi.fn(() => ({
      fftSize: 512,
      smoothingTimeConstant: 0.8,
      frequencyBinCount: 256,
      connect: vi.fn(),
      disconnect: analyserDisconnect,
    }));

    createBufferSource = vi.fn(() => createMockSource());

    decodeAudioData = vi.fn(async () => ({
      duration: 3,
    }));
  }

  vi.stubGlobal("AudioContext", MockAudioContext);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AudioEngine cleanup", () => {
  it("stops and disconnects an active source", async () => {
    const engine = new AudioEngine();

    await engine.play({ duration: 3 } as AudioBuffer);

    expect(sources).toHaveLength(1);
    expect(sources[0].start).toHaveBeenCalledOnce();

    engine.stop();

    expect(sources[0].stop).toHaveBeenCalledOnce();
    expect(sources[0].disconnect).toHaveBeenCalledOnce();

    await engine.dispose();
  });

  it("disconnects a source when playback ends naturally", async () => {
    const engine = new AudioEngine();

    await engine.play({ duration: 3 } as AudioBuffer);

    const source = sources[0];

    expect(source.onended).toBeTypeOf("function");

    source.onended?.();

    expect(source.disconnect).toHaveBeenCalledOnce();
    expect(source.onended).toBeNull();

    await engine.dispose();
  });

  it("disconnects previous source before playing a new one", async () => {
    const engine = new AudioEngine();

    await engine.play({ duration: 3 } as AudioBuffer);
    await engine.play({ duration: 5 } as AudioBuffer);

    expect(sources).toHaveLength(2);

    expect(sources[0].stop).toHaveBeenCalledOnce();
    expect(sources[0].disconnect).toHaveBeenCalledOnce();

    expect(sources[1].start).toHaveBeenCalledOnce();

    await engine.dispose();
  });

  it("closes AudioContext and disconnects analyser on dispose", async () => {
    const engine = new AudioEngine();

    await engine.play({ duration: 3 } as AudioBuffer);
    await engine.dispose();

    expect(sources[0].stop).toHaveBeenCalledOnce();
    expect(sources[0].disconnect).toHaveBeenCalledOnce();

    expect(analyserDisconnect).toHaveBeenCalledOnce();
    expect(contextClose).toHaveBeenCalledOnce();

    await expect(
      engine.load("/track-1.mp3")
    ).rejects.toThrow("Audio engine has been disposed");
  });

  it("does not close AudioContext twice", async () => {
    const engine = new AudioEngine();

    await engine.dispose();
    await engine.dispose();

    expect(contextClose).toHaveBeenCalledOnce();
  });
});
