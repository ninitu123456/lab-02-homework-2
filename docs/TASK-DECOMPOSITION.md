# Homework 2 — Task Decomposition

## Project Overview

**Project:** Concurrent FIFO Audio Visualizer Queue Engine

**Objective:** Build an asynchronous FIFO audio processing engine with Web Audio API, cancellation, explicit resource cleanup, and real-time frequency visualization.

## Task Breakdown

| ID | Task | Deliverable | Priority |
|---|---|---|---|
| T01 | Project setup and architecture | Next.js structure | High |
| T02 | Audio task and queue definitions | AudioTask interface | High |
| T03 | FIFO concurrency controller | AudioTaskQueue | Critical |
| T04 | Fetch and audio decoding | Fetch + decodeAudioData | Critical |
| T05 | AbortController cancellation | Cancellation handling | Critical |
| T06 | Audio playback engine | AudioEngine | High |
| T07 | AnalyserNode FFT processing | Frequency data | High |
| T08 | Canvas visualization | AudioVisualizer | High |
| T09 | React player integration | AudioPlayer | High |
| T10 | Resource cleanup | Dispose and cancellation | Critical |
| T11 | FIFO and cancellation testing | Automated tests | Critical |
| T12 | Performance and memory testing | Test report | High |
| T13 | Documentation and submission | README and evidence | Medium |

## Dependency Flow

T01 → T02 → T03 → T04 → T05

T04 → T06 → T07 → T08 → T09

T05 + T09 → T10 → T11 → T12 → T13

## Acceptance Criteria

- Tasks are processed in FIFO order.
- Only one download/decode task is active at a time.
- Concurrent enqueue calls do not cause overlapping processing.
- Cancellation uses AbortController.
- Failed tasks do not block subsequent tasks.
- AudioBufferSourceNodes are explicitly disconnected.
- AudioContext is closed during disposal.
- Visualizer uses AnalyserNode with FFT size 256 or 512.
- Animation uses requestAnimationFrame without per-frame React state updates.
- Animation frames are cancelled during cleanup.
- FIFO, cancellation, memory and performance tests are documented.

## Verification Status

Implementation is not considered fully verified until automated concurrency tests, cancellation tests, memory inspection and performance measurements have been completed.