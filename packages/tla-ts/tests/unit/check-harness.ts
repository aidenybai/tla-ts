import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { check, type CheckOptions } from "../../src";
import type { TlcVersion } from "../../src/tlc/version";

export const FIXTURES = join(import.meta.dirname, "../fixtures");

export const checkFixture = (
  directory: string,
  name: string,
  configName = name,
  options: Partial<CheckOptions> = {},
) =>
  check({
    source: readFileSync(join(FIXTURES, directory, `${name}.tla`), "utf8"),
    config: readFileSync(join(FIXTURES, directory, `${configName}.cfg`), "utf8"),
    ...options,
  });

export const getModuleLoader = (directory: string) => (name: string) => {
  const path = join(FIXTURES, directory, `${name}.tla`);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

export const checkModule = (body: string, config = "") =>
  check({
    source: `---- MODULE M ----\nEXTENDS Integers, Sequences, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = x\n${body}\n====`,
    config: `${config}\nINIT Init\nNEXT Next`,
  });

export const checkSteps = (definitions: string, config: string, version?: TlcVersion) =>
  check({
    source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 3 /\\ x' = x + 1\n${definitions}\n====`,
    config,
    version,
  });
