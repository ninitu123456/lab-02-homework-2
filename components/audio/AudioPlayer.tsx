
"use client";

import { useEffect, useRef, useState } from "react";
import AudioVisualizer from "./AudioVisualizer";
import { AudioEngine } from "@/lib/audio/audio-engine";
import { tracks } from "@/data/tracks";

export default function AudioPlayer() {
  const engineRef = useRef<AudioEngine | null>(null);
  const generationRef = useRef(0);

  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);

  useEffect(() => {
  const generation = generationRef;
  const engine = engineRef;

  return () => {
    generation.current += 1;

    const instance = engine.current;
    engine.current = null;

    if (instance) {
      void instance.dispose();
    }
  };
}, []);

  function getEngine(): AudioEngine {
    if (!engineRef.current) {
      const instance = new AudioEngine();
      engineRef.current = instance;
      setEngine(instance);
    }

    return engineRef.current;
  }

  async function loadTracks() {
    const instance = getEngine();
    const generation = ++generationRef.current;

    instance.queue.cancelAll();
    instance.stop();

    setBusy(true);
    setStatus("Downloading and decoding audio...");
    setCurrentTrack(null);

    const results = await Promise.allSettled(
      tracks.map((track) => instance.load(track.url))
    );

    if (generation !== generationRef.current) return;

    const firstSuccess = results.find(
      (result): result is PromiseFulfilledResult<AudioBuffer> =>
        result.status === "fulfilled"
    );

    setBusy(false);

    if (!firstSuccess) {
      setStatus("No tracks loaded. Check MP3 files.");
      return;
    }

    try {
      await instance.play(firstSuccess.value);

      if (generation !== generationRef.current) return;

      const index = results.indexOf(firstSuccess);

      setCurrentTrack(tracks[index].title);

      const successful = results.filter(
        (result) => result.status === "fulfilled"
      ).length;

      setStatus(
        `Completed: ${successful}/${tracks.length} tracks decoded`
      );
    } catch {
      if (generation === generationRef.current) {
        setStatus("Playback failed");
      }
    }
  }

  function stopAudio() {
    generationRef.current++;

    engineRef.current?.queue.cancelAll();
    engineRef.current?.stop();

    setBusy(false);
    setCurrentTrack(null);
    setStatus("Stopped / pending tasks cancelled");
  }

  return (
    <section className="space-y-6 rounded-2xl border border-slate-300 bg-white p-6 text-slate-950 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold">
          FIFO Audio Queue Engine
        </h2>

        <p className="mt-2 text-slate-700">
          Sequential downloads, audio decoding and
          real-time frequency visualization.
        </p>
      </div>

      <AudioVisualizer analyser={engine?.analyser ?? null} />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void loadTracks()}
          disabled={busy}
          className="rounded-lg bg-blue-800 px-5 py-3 font-semibold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
        >
          Load Queue & Play
        </button>

        <button
          type="button"
          onClick={stopAudio}
          className="rounded-lg border border-slate-500 px-5 py-3 font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
        >
          Stop / Cancel
        </button>
      </div>

      <div className="rounded-lg bg-slate-100 p-4">
        <p role="status" aria-live="polite" className="font-medium">
          Status: {status}
        </p>

        <p className="mt-2">
          Now playing: {currentTrack ?? "None"}
        </p>

        <p className="mt-2 text-sm text-slate-700">
          FFT size: {engine?.analyser.fftSize ?? 512} ·
          Frequency bins: {engine?.frequencyBinCount ?? 256}
        </p>
      </div>

      <h3 className="text-lg font-semibold">
        Track Queue
      </h3>

      <ol className="list-inside list-decimal space-y-2">
        {tracks.map((track) => (
          <li
            key={track.id}
            className="rounded-lg bg-slate-50 p-3"
          >
            {track.title}
          </li>
        ))}
      </ol>
    </section>
  );
}
