# HW2 — Task Decomposition

## 1. Project Overview

**Project:** Concurrent FIFO Audio Visualizer Queue Engine

**Objective:** Develop a browser-based audio processing application that handles concurrent enqueue requests using sequential FIFO execution, supports task cancellation, visualizes audio frequency data in real time, and safely manages Web Audio resources.

**Technology Stack:** Next.js, React, TypeScript, Web Audio API, Canvas API, Vitest, Playwright.

## 2. Functional Decomposition

| Task ID | Module | Responsibility | Deliverable | Dependency |
|---|---|---|---|---|
| T01 | Project Setup | Initialize Next.js, TypeScript and repository | Project foundation | None |
| T02 | Audio Data | Define audio metadata and sample files | `data/tracks.ts`, `public/audio/` | T01 |
| T03 | FIFO Queue | Implement sequential download and decoding | `audio-queue-controller.ts` | T01 |
| T04 | Cancellation | Implement AbortController and queue disposal | Queue cancellation logic | T03 |
| T05 | Audio Engine | Manage AudioContext, AnalyserNode and playback | `audio-engine.ts` | T03–T04 |
| T06 | Visualization | Render FFT frequency data with requestAnimationFrame | `AudioVisualizer.tsx` | T05 |
| T07 | User Interface | Integrate queue, playback and status messages | `AudioPlayer.tsx` | T02–T06 |
| T08 | Unit Testing | Validate FIFO, errors and cancellation | 6 unit tests | T03–T04 |
| T09 | Resource Testing | Validate playback cleanup and context disposal | 5 unit tests | T05 |
| T10 | Stress Testing | Simulate 100 tasks and intermittent failures | 3 stress tests | T03 |
| T11 | E2E Testing | Verify browser integration and user interactions | 5 Playwright tests | T07 |
| T12 | Performance | Profile rendering and memory behavior | Performance report | T07 |
| T13 | Documentation | Consolidate architecture, test evidence and instructions | Final documentation | T01–T12 |

## 3. Implementation Sequence

Project Setup → Audio Data and FIFO Queue → Cancellation → Audio Engine → FFT Visualizer → UI Integration → Automated Testing → Performance Profiling → Documentation.

## 4. Core Design Decisions

### FIFO Processing

Concurrent calls to `enqueue()` are accepted, but the queue executes one task at a time. Each task performs download and decoding before the next task begins.

### Cancellation

Each queued task owns an AbortController. Active network requests can be aborted, pending tasks can be rejected, and results from cancelled decoding operations are discarded.

### Visualization

The Canvas renderer uses `requestAnimationFrame` and reads frequency data directly from AnalyserNode. React state is not updated for each animation frame.

### Resource Lifecycle

AudioBufferSourceNode instances are stopped and disconnected when appropriate. The audio engine disconnects the analyser and closes AudioContext during disposal.

## 5. Acceptance Criteria

| Criterion | Verification |
|---|---|
| FIFO ordering | Unit tests |
| Sequential processing | Unit and stress tests |
| AbortController cancellation | Unit tests |
| Error recovery | Unit and stress tests |
| Audio node cleanup | AudioEngine unit tests |
| FFT 256/512 support | Implementation and browser inspection |
| Real-time visualization | Browser E2E and manual inspection |
| Responsive playback interface | Playwright E2E |
| Rendering performance | Chrome DevTools |
| Memory behavior | Heap profiling and cleanup tests |

## 6. Limitations

- Audio decoding cannot be interrupted directly after `decodeAudioData()` begins; cancelled results are discarded.
- FPS depends on device performance and display refresh rate.
- Passing unit tests does not prove the complete absence of memory leaks.
- Performance measurements must be reported using actual browser observations.
