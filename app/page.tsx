import AudioPlayer from "@/components/audio/AudioPlayer";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="font-semibold text-blue-800">
            Advanced Web Development — Homework 2
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Concurrent FIFO Audio Visualizer
          </h1>

          <p className="mt-3 text-slate-700">
            Web Audio API, FIFO concurrency control,
            cancellation and real-time frequency analysis.
          </p>
        </header>

        <AudioPlayer />
      </div>
    </main>
  );
}