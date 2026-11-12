import { spawnSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll } from "vite-plus/test";
import { FIXTURES } from "./check-harness";

export const CLI = join(import.meta.dirname, "../../src/cli.ts");

export const JAR_174 = join(FIXTURES, "xml-export", "tla2tools-1.7.4.jar");

afterAll(() =>
  readdirSync(FIXTURES, { recursive: true, encoding: "utf8" })
    .filter((path) => /_TTrace_\d+\.(tla|bin)$/.test(path))
    .forEach((path) => rmSync(join(FIXTURES, path))),
);

export const runCliWith = (directory: string, args: string[]) =>
  spawnSync("bun", [CLI, ...args], { cwd: join(FIXTURES, directory), encoding: "utf8" });

export const getToolSequence = (output: string) =>
  output
    .split("\n")
    .filter((line) => line.startsWith("@!@!@STARTMSG") || line.startsWith("<<"))
    .map((line) => line.match(/^@!@!@STARTMSG (\d+):/)?.[1] ?? line);
