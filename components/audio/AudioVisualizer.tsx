
"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
}

export default function AudioVisualizer({
  analyser,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyser) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frequencyData = new Uint8Array(
      analyser.frequencyBinCount
    );

    let animationId = 0;
    let isActive = true;

    const draw = () => {
      if (!isActive) return;

      const width = canvas.width;
      const height = canvas.height;

      analyser.getByteFrequencyData(frequencyData);

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      const numberOfBars = 64;
      const barWidth = width / numberOfBars;

      for (let i = 0; i < numberOfBars; i++) {
        const start = Math.floor(
          (i * frequencyData.length) / numberOfBars
        );

        const end = Math.floor(
          ((i + 1) * frequencyData.length) / numberOfBars
        );

        let peak = 0;

        for (let j = start; j < end; j++) {
          peak = Math.max(peak, frequencyData[j]);
        }

        const barHeight = (peak / 255) * (height - 20);

        ctx.fillStyle = `hsl(${190 + i}, 85%, 65%)`;

        ctx.fillRect(
          i * barWidth + 1,
          height - barHeight,
          Math.max(1, barWidth - 2),
          barHeight
        );
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      isActive = false;
      cancelAnimationFrame(animationId);
    };
  }, [analyser]);

  return (
    <figure className="space-y-2">
      <canvas
        ref={canvasRef}
        width={800}
        height={240}
        role="img"
        aria-label="Real-time audio frequency visualization"
        className="h-auto w-full rounded-xl"
      />

      <figcaption className="text-sm text-slate-600">
        Real-time FFT frequency visualization
      </figcaption>
    </figure>
  );
}
