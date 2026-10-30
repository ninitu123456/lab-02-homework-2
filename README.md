# Concurrent FIFO Audio Visualizer Queue Engine

A browser-based audio processing application built with Next.js, React and TypeScript. The project demonstrates sequential FIFO processing of concurrent enqueue requests, cancellable audio downloads, Web Audio resource management and real-time FFT visualization.

## Features

- FIFO queue for audio download and decoding
- Concurrent enqueue requests with sequential processing
- AbortController-based cancellation
- Error isolation and recovery
- Audio playback using Web Audio API
- Real-time FFT Canvas visualization
- AudioBufferSourceNode cleanup and AudioContext disposal
- Automated unit, stress and end-to-end testing

## Technology Stack

| Category | Technology |
|---|---|
| Framework | Next.js |
| UI | React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Audio Processing | Web Audio API |
| Visualization | Canvas API |
| Unit Testing | Vitest |
| E2E Testing | Playwright |
| Performance Analysis | Chrome DevTools |

## Getting Started

### Prerequisites

- Node.js and npm
- Google Chrome or a Chromium-based browser

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open `http://localhost:3000`.

### Production

```bash
npm run build
npm run start
```

## How to Use

1. Open the application.
2. Click **Load Queue & Play**.
3. The application downloads and decodes three sample tracks sequentially.
4. The first successfully decoded track begins playback.
5. The FFT visualizer displays audio frequency information.
6. Click **Stop / Cancel** to stop playback and cancel pending queue tasks.

## Architecture

### AudioTaskQueue

Located in `lib/audio/audio-queue-controller.ts`.

Responsibilities:
- FIFO scheduling
- Sequential download and decoding
- AbortController management
- Error handling
- Cancellation and disposal

### AudioEngine

Located in `lib/audio/audio-engine.ts`.

Responsibilities:
- AudioContext lifecycle
- AudioBufferSourceNode playback
- AnalyserNode configuration
- Source cleanup
- Audio resource disposal

### AudioVisualizer

Located in `components/audio/AudioVisualizer.tsx`.

Responsibilities:
- Read frequency data from AnalyserNode
- Render FFT bars on Canvas
- Schedule frames with requestAnimationFrame
- Cancel animation when unmounted

### AudioPlayer

Located in `components/audio/AudioPlayer.tsx`.

Responsibilities:
- Integrate the audio engine and queue
- Manage user interactions
- Display playback and loading status
- Connect the visualizer to the audio analyser

## Testing

### Unit and Stress Tests

```bash
npm test
```

Test suites:
- FIFO queue: 6 tests
- AudioEngine cleanup: 5 tests
- Stress testing: 3 tests

### End-to-End Tests

```bash
npm run test:e2e
```

Playwright verifies the audio player interface, Canvas accessibility, audio loading, stop/cancel behavior and FFT configuration.

### Code Quality

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Documentation

- [Task Decomposition](docs/TASK-DECOMPOSITION.md)
- [Automated Test Report](docs/TEST-REPORT.md)
- [Performance Report](docs/PERFORMANCE-REPORT.md)
- [AI Failure Audit](AI_Failure_Audit.md)

## Technical Limitations

- Audio decoding cannot be directly aborted after it starts.
- Rendering performance depends on the device and browser.
- Automated cleanup tests do not prove the complete absence of memory leaks.
- Audio playback begins after the batch of queued tracks has settled.

## Project Status

Core implementation and automated testing completed. Final browser performance evidence is documented separately.
