// news-image-nov19 — entrypoint: deliver the day's front page to the grader.
//
// The entry is one image, entry.png, stored next to this file. This script
// copies it into the output directory the grader provides. The image is
// located through this file's own URL (import.meta.url), so the copy works
// no matter which directory the grader runs the script from — a plain
// relative path like "./entry.png" would resolve against the grader's cwd
// and miss the file entirely.

import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const entryImage = new URL("./entry.png", import.meta.url);
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Refuse to hand the grader a broken entry: check the image is really
// there and non-empty before copying, so a missing file fails here with a
// clear message instead of surfacing as a cryptic ENOENT from copyFileSync.
let sourceBytes: number;
try {
  sourceBytes = statSync(entryImage).size;
} catch {
  throw new Error(
    `news-image-nov19: entry.png not found next to main.ts (looked at ${entryImage.pathname})`,
  );
}
if (sourceBytes === 0) {
  throw new Error("news-image-nov19: entry.png is empty (0 bytes) — refusing to submit a blank image");
}

mkdirSync(outputDir, { recursive: true });
const outputPath = join(outputDir, "entry.png");
copyFileSync(entryImage, outputPath);

// Verify the copy landed whole: a short copy (interrupted write, full
// disk) would otherwise reach the grader as a corrupt image. Size alone is
// a weak check, so compare SHA-256 digests of source and copy as well.
const copiedBytes = statSync(outputPath).size;
if (copiedBytes !== sourceBytes) {
  throw new Error(
    `news-image-nov19: copied entry.png is ${copiedBytes} bytes, expected ${sourceBytes} — the copy is incomplete`,
  );
}
const hash = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
if (hash(entryImage) !== hash(outputPath)) {
  throw new Error("news-image-nov19: copied entry.png hash does not match the source — the copy is corrupt");
}

console.log(`news-image-nov19: wrote ${copiedBytes} bytes to ${outputPath}`);
