import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const runtimeDir = path.join(projectRoot, "runtime-package");

await rm(runtimeDir, { recursive: true, force: true });
await mkdir(runtimeDir, { recursive: true });

await cp(path.join(projectRoot, ".next", "standalone"), runtimeDir, {
  recursive: true,
});
await cp(path.join(projectRoot, ".next", "static"), path.join(runtimeDir, ".next", "static"), {
  recursive: true,
});
await cp(path.join(projectRoot, "public"), path.join(runtimeDir, "public"), {
  recursive: true,
});

console.log(`Runtime package generated at ${runtimeDir}`);
