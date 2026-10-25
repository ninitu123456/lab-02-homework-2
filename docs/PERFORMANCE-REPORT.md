# HW2 — Performance Report

## 1. Test Environment

- Application: Concurrent FIFO Audio Visualizer Queue Engine
- Browser: Google Chrome
- Testing Tool: Chrome DevTools Performance and Memory
- Build Mode: Production (verify before final submission)

## 2. Rendering Performance

A Chrome DevTools Performance recording was captured during application interaction.

### Observed Metrics

| Metric | Observation |
|---|---|
| Recording duration | Approximately 10.52 seconds |
| Interaction to Next Paint (INP) | 85 ms |
| Cumulative Layout Shift (CLS) | 0 |
| Scripting time | 423 ms |
| Rendering time | 71 ms |
| Painting time | 125 ms |
| Frame timeline | Some slow-frame regions observed |
| Average FPS | Not yet verified |

### Interpretation

The recorded interaction latency and layout stability are positive indicators. However, the frame timeline contains slower-frame regions, and the current evidence does not establish a sustained 60 FPS rendering rate.

## 3. Memory Profiling

**Status:** Pending final measurement.

### Test Procedure

1. Capture a baseline heap snapshot.
2. Perform 10–30 load/play/stop cycles.
3. Trigger garbage collection where available.
4. Capture another heap snapshot.
5. Compare retained objects and heap growth.
6. Investigate objects whose retained counts continue increasing.

### Results

- Baseline heap: Pending
- Heap after cycles: Pending
- Retained object analysis: Pending
- Memory leak conclusion: Inconclusive

## 4. Resource Cleanup

Automated unit tests verify that audio source nodes are stopped and disconnected, analyser connections are released during disposal, and AudioContext is closed.

These tests validate the implemented lifecycle logic but do not independently establish that the browser has no native-memory leaks.

## 5. Final Assessment

Core resource cleanup logic is covered by automated tests. Additional browser measurements are required to verify sustained rendering performance and long-running memory stability.
