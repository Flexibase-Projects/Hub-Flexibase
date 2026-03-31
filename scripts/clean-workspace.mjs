import { rm } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const targets = [
  ".next",
  "coverage",
  "playwright-report",
  "test-results",
  "tsconfig.tsbuildinfo",
];

await Promise.all(
  targets.map((target) =>
    rm(path.join(projectRoot, target), {
      recursive: true,
      force: true,
    })
  )
);

console.log(`Cleaned ${targets.length} workspace artifacts.`);
