#!/usr/bin/env node

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

function runGit(args, cwd) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  return result;
}

function getRepoRoot() {
  const root = runGit(["rev-parse", "--show-toplevel"], process.cwd());
  if (root.status !== 0) {
    console.error("[ignored-build-step] Not inside a git repository.");
    process.exit(1);
  }
  return root.stdout.trim();
}

function commitExists(commit, cwd) {
  if (!commit) return false;
  const check = runGit(["cat-file", "-e", `${commit}^{commit}`], cwd);
  return check.status === 0;
}

function normalizePath(path) {
  return path.replace(/\\/g, "/").replace(/^\.?\//, "").replace(/\/+$/, "");
}

const appPathArg = process.argv[2];
if (!appPathArg) {
  console.error("[ignored-build-step] Missing app path argument.");
  console.error("Usage: node scripts/vercel/ignored-build-step.mjs apps/<app>");
  process.exit(1);
}

const repoRoot = getRepoRoot();
const appPath = normalizePath(appPathArg);
const watched = [
  appPath,
  "packages",
  "package.json",
  "package-lock.json",
  "turbo.json",
  "tsconfig.base.json",
  ".npmrc",
];

const baseFromVercel = process.env.VERCEL_GIT_PREVIOUS_SHA;
let baseCommit = "";
if (baseFromVercel && !/^0+$/.test(baseFromVercel) && commitExists(baseFromVercel, repoRoot)) {
  baseCommit = baseFromVercel;
} else if (commitExists("HEAD^", repoRoot)) {
  baseCommit = "HEAD^";
}

if (!baseCommit) {
  console.log("[ignored-build-step] No previous commit detected. Running build.");
  process.exit(1);
}

const diff = runGit(["diff", "--name-only", `${baseCommit}`, "HEAD"], repoRoot);
if (diff.status !== 0) {
  console.log("[ignored-build-step] Could not read git diff. Running build.");
  process.exit(1);
}

const changedFiles = diff.stdout
  .split("\n")
  .map((line) => normalizePath(line))
  .filter(Boolean);

if (changedFiles.length === 0) {
  console.log("[ignored-build-step] No changed files. Skipping build.");
  process.exit(0);
}

const shouldBuild = changedFiles.some((file) =>
  watched.some((path) => file === path || file.startsWith(`${path}/`))
);

if (shouldBuild) {
  console.log(`[ignored-build-step] Changes detected for ${appPath}. Running build.`);
  process.exit(1);
}

console.log(`[ignored-build-step] No relevant changes for ${appPath}. Skipping build.`);
process.exit(0);

