
import { test, expect } from "@playwright/test";

test.describe("FIFO Audio Player E2E", () => {
  test("renders audio player and track list", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "FIFO Audio Queue Engine",
      })
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Load Queue & Play",
      })
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Stop / Cancel",
      })
    ).toBeVisible();

    await expect(page.getByText("Track 1", { exact: true })).toBeVisible();
    await expect(page.getByText("Track 2", { exact: true })).toBeVisible();
    await expect(page.getByText("Track 3", { exact: true })).toBeVisible();
  });

  test("renders an accessible canvas visualizer", async ({ page }) => {
    await page.goto("/");

    const canvas = page.getByRole("img", {
      name: "Real-time audio frequency visualization",
    });

    await expect(canvas).toBeVisible();

    const dimensions = await canvas.evaluate((element) => {
      const canvas = element as HTMLCanvasElement;

      return {
        width: canvas.width,
        height: canvas.height,
      };
    });

    expect(dimensions.width).toBe(800);
    expect(dimensions.height).toBe(240);
  });

  test("loads audio and starts playback", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", {
      name: "Load Queue & Play",
    }).click();

    await expect(
      page.getByRole("status")
    ).toContainText("Completed: 3/3", {
      timeout: 30000,
    });

    await expect(
      page.getByText("Now playing: Track 1")
    ).toBeVisible();
  });

  test("stops audio and cancels pending tasks", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", {
      name: "Load Queue & Play",
    }).click();

    await page.getByRole("button", {
      name: "Stop / Cancel",
    }).click();

    await expect(
      page.getByRole("status")
    ).toContainText("Stopped / pending tasks cancelled");

    await expect(
      page.getByText("Now playing: None")
    ).toBeVisible();
  });

  test("shows the configured FFT size", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", {
      name: "Load Queue & Play",
    }).click();

    await expect(page.getByText(/FFT size: 512/)).toBeVisible();
    await expect(page.getByText(/Frequency bins: 256/)).toBeVisible();
  });
});
