# AI Failure Audit — Homework 2

**Project:** Concurrent FIFO Audio Visualizer Queue Engine

**Audit date:** 2026-10-30

**Method:** Static review of source code, tests, documentation, and local Git history.

## 1. Scope and evidence

This audit examines failures and verification gaps relevant to AI-assisted development of the audio queue application. The repository does not include AI conversation transcripts or prompt history, so individual changes cannot be conclusively attributed to AI. Historical corrections are separated from issues identified during this review.

Reviewed evidence:

- `lib/audio/audio-queue-controller.ts` and `lib/audio/audio-engine.ts`
- `components/audio/AudioPlayer.tsx` and `components/audio/AudioVisualizer.tsx`
- All three unit/stress test files under `tests/unit/`
- `tests/e2e/audio-player.spec.ts`
- `vitest.config.ts`, `playwright.config.ts`, and `package.json`
- `README.md`, `docs/TEST-REPORT.md`, and `docs/PERFORMANCE-REPORT.md`
- Git commit `53a67ee` and `test-results/.last-run.json`

No application code was changed. Unit tests, browser tests, lint, type checking, production builds, and performance measurements were not rerun for this documentation audit. The test report records 14 passing unit/stress tests; E2E entries say `PASS — confirm run`, and several quality-check results remain placeholders. The saved last-run file says `passed`, but does not by itself establish the tested revision or environment. These are existing artifacts, not fresh results.

## 2. Failure log

### F01 — Test runners needed explicit separation

- **Evidence:** Commit `53a67ee`, titled `fix: separate Vitest unit tests from Playwright E2E tests`, adds `vitest.config.ts` with `include: ["tests/unit/**/*.test.ts"]` and `exclude: ["tests/e2e/**"]`.
- **Failure:** The recorded correction addresses test discovery crossing the intended boundary between unit tests and browser tests. No original failing console output is included in the commit, so the exact error is not reconstructed here.
- **Impact:** Incorrect discovery can cause runner-specific tests to be collected by the wrong framework and block verification.
- **Recorded correction:** Restrict Vitest to unit tests. Playwright separately uses `testDir: "./tests/e2e"`.
- **Status:** Configuration correction confirmed in Git; not rerun during this audit.
- **Lesson:** Review generated testing setup as a whole, including runner discovery rules, rather than only inspecting individual tests.

### F02 — Stop does not invalidate playback waiting for resume

- **Evidence:** `AudioEngine.play()` awaits `context.resume()`, then checks only `disposed` before creating and starting a source. `stop()` stops the currently assigned source but does not invalidate a pending `play()`. `AudioPlayer` checks its generation after awaiting `instance.play()`, once the source may already have started.
- **Failure scenario:** If `resume()` remains pending, the user can press Stop while no source exists. When resume resolves, `play()` can still start a new source. The UI generation check prevents stale status updates but does not prevent that audio side effect.
- **Impact:** Playback could begin after the UI reports `Stopped / pending tasks cancelled`.
- **Proposed correction:** Add a playback request token in the engine. Invalidate it on stop/dispose and check it after asynchronous waits before starting a source. Preserve the intended replacement behavior when starting a new source.
- **Verification needed:** Hold a mocked resume promise pending, call play, call stop, resolve resume, and assert that no source starts. Add an integration case for the player.
- **Status:** Open race identified by static inspection; not reproduced in a browser.
- **Lesson:** Cancellation must guard asynchronous side effects, not only subsequent React state updates.

### F03 — Playback completion does not clear the UI track

- **Evidence:** The source `onended` handler disconnects the node and clears the engine's private source reference. It does not notify `AudioPlayer`, where `currentTrack` is cleared only during loading or Stop.
- **Failure:** After natural playback completion, the UI can continue displaying `Now playing: Track 1` even though the source has ended.
- **Impact:** The displayed playback state becomes stale.
- **Proposed correction:** Expose an ended notification or playback-state subscription and clear the current track when the active source ends. Guard against completion from an older source updating a newer playback session.
- **Verification needed:** Simulate natural completion and assert both node cleanup and the player returning to an idle/completed state.
- **Status:** Open; the existing natural-completion unit test verifies engine cleanup only.
- **Lesson:** Resource lifecycle correctness and user-visible state correctness require separate verification.

### F04 — Batch settlement delays playback and can hold the UI busy

- **Evidence:** `loadTracks()` awaits `Promise.allSettled()` for every track before selecting the first successful buffer and calling play. Queue fetches have no application-level timeout.
- **Failure risk:** If a later request remains pending, an already decoded first track cannot begin playback and the load button remains disabled until the batch settles or the user presses Stop.
- **Impact:** A slow or stalled later track delays useful playback. This is a consequence of the current batch policy, not a FIFO ordering defect.
- **Proposed follow-up:** Decide whether playback should start on the first successful decode or intentionally wait for the full batch. If keeping batch behavior, make that delay explicit in usage instructions and consider a timeout/retry policy for stalled downloads.
- **Verification needed:** Resolve the first track and hold a later fetch pending; assert the chosen playback policy and verify Stop still cancels the batch.
- **Status:** Design limitation, acknowledged partly by the README's batch-playback limitation. The usage wording should clarify when playback begins.
- **Lesson:** AI-generated concurrent orchestration should be checked against user-facing latency expectations as well as ordering requirements.

### F05 — E2E assertions do not prove all advertised behavior

- **Evidence:** The FFT test checks displayed text, which has fallback values of 512 and 256 even without an engine. The Canvas test checks its label and dimensions. The stop/cancel E2E test checks status and track text immediately after Stop.
- **Failure:** These checks do not independently prove actual analyser configuration, changing FFT drawing, or that audio remains stopped after outstanding asynchronous work completes.
- **Impact:** The tests can pass while important integration behavior is broken. Existing queue cancellation and engine cleanup unit tests provide useful but separate coverage.
- **Proposed correction:** Verify actual analyser properties through controlled instrumentation, observe changing Canvas output during known audio input, and wait for controlled delayed work to settle after Stop before asserting that playback stays inactive. Keep mocks/instrumentation out of normal product UI.
- **Additional limit:** Playwright launches Chromium with `--autoplay-policy=no-user-gesture-required`. A passing run under that flag does not verify default browser autoplay behavior; test the normal user-gesture flow separately.
- **Status:** Open coverage gaps; no Canvas or analyser malfunction is established by these assertions alone.
- **Lesson:** Generated tests should observe the behavior named by the test rather than relying solely on labels and status strings.

### F06 — Performance and completion claims need stronger evidence

- **Evidence:** `PERFORMANCE-REPORT.md` lists average FPS as unverified and memory profiling as pending. Its production build mode also requires confirmation. `TEST-REPORT.md` leaves several command results as `Record actual result`.
- **Failure risk:** Treating the final documentation commit or mocked cleanup tests as proof of sustained 60 FPS, absence of memory leaks, or a fully verified production build would exceed the recorded evidence.
- **Impact:** Submission claims could overstate what has actually been measured.
- **Proposed follow-up:** Replace placeholders only after fresh runs. Record the tested commit, commands, browser/device, build mode, and results. Compare baseline and post-cycle heap snapshots and inspect retained objects; measure frame behavior over a representative playback interval.
- **Status:** Verification incomplete. The existing performance report appropriately describes its memory conclusion as inconclusive and does not establish sustained 60 FPS.
- **Lesson:** Separate source-level cleanup, mocked lifecycle tests, and real browser performance measurements.

## 3. Recommended next steps

1. Resolve the pending-resume cancellation race in F02 and add a deterministic regression test.
2. Synchronize natural playback completion with the UI as described in F03.
3. Confirm and document the batch playback policy in F04.
4. Strengthen browser coverage from F05, including default autoplay behavior and delayed cancellation.
5. After code changes, run `npm test`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`. The current Playwright configuration starts or reuses a development server; record that mode and perform production verification separately where needed.
6. Complete the pending performance and memory measurements and update the reports using actual results.

## 4. Reflection on AI-assisted development

The queue already separates sequential processing from concurrent enqueue requests, discards cancelled decode results, and isolates task failures. These useful design choices still need integration review: cancellation can protect one layer while playback continues in another, node cleanup can succeed while UI state remains stale, and passing tests can leave real browser behavior unverified. Review AI suggestions across asynchronous boundaries and require evidence that matches each claim.
