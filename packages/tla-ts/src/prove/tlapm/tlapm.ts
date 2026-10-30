// The tlapm backend: runs tlapm on a module and reads each obligation's result from its Toolbox
// messages.

import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";
import { TlaUnsupportedError } from "../../errors";

export type TlapmResult =
  | { status: "proved"; prover: string }
  | { status: "trivial" }
  | { status: "failed"; reason: string };

export interface TlapmOptions {
  signal?: AbortSignal;
  onResult?: (id: number, result: TlapmResult) => void;
}

// Each tlapm on the PATH, first to last.
export const getTlapmPaths = () =>
  (process.env.PATH ?? "")
    .split(delimiter)
    .map((directory) => join(directory, "tlapm"))
    .filter((path) => existsSync(path));

// tlapm's Toolbox protocol: each message is @!!BEGIN, then @!!name:value lines, then @!!END.
const parseToolboxMessages = (text: string) =>
  text
    .split("@!!BEGIN\n")
    .slice(1)
    .flatMap((block) => {
      const end = block.indexOf("@!!END");
      if (end === -1) return [];
      const fields = new Map<string, string>();
      block
        .slice(0, end)
        .split(/\n(?=@!!)/)
        .forEach((line) => {
          const separator = line.indexOf(":");
          fields.set(line.slice(3, separator), line.slice(separator + 1).replace(/\n$/, ""));
        });
      return [fields];
    });

const getResult = (fields: Map<string, string>): TlapmResult | undefined => {
  const status = fields.get("status");
  if (status === "proved") return { status, prover: fields.get("prover") ?? "" };
  if (status === "trivial") return { status };
  if (status === "failed" || status === "interrupted")
    return { status: "failed", reason: fields.get("reason") || status };
  return undefined;
};

// Runs tlapm with --toolbox 0 0 on the module name, which modules holds with each module it
// extends or instances, and returns the last result tlapm reported for each obligation.
export const proveWithTlapm = async (
  name: string,
  modules: Map<string, string>,
  options: TlapmOptions,
) => {
  const tlapm = getTlapmPaths()[0];
  if (tlapm === undefined)
    throw new TlaUnsupportedError("The tlapm backend needs tlapm on your PATH.");
  const childProcess = await import("node:child_process");
  const fs = await import("node:fs");
  const os = await import("node:os");
  const directory = fs.mkdtempSync(join(os.tmpdir(), "tla-ts-"));
  modules.forEach((source, moduleName) =>
    fs.writeFileSync(join(directory, `${moduleName}.tla`), source),
  );
  const results = new Map<number, TlapmResult>();
  const child = childProcess.spawn(
    tlapm,
    ["--toolbox", "0", "0", "--cache-dir", join(directory, ".tlacache"), `${name}.tla`],
    { cwd: directory, stdio: ["ignore", "ignore", "pipe"] },
  );
  const kill = () => child.kill();
  options.signal?.addEventListener("abort", kill);
  const output = { text: "", parsed: 0 };
  child.stderr.on("data", (chunk: Buffer) => {
    output.text += chunk.toString("utf8");
    const messages = parseToolboxMessages(output.text);
    messages.slice(output.parsed).forEach((fields) => {
      const result = getResult(fields);
      const id = Number(fields.get("id"));
      if (fields.get("type") !== "obligation" || !result) return;
      results.set(id, result);
      options.onResult?.(id, result);
    });
    output.parsed = messages.length;
  });
  await new Promise((resolve) => child.on("close", resolve));
  options.signal?.removeEventListener("abort", kill);
  fs.rmSync(directory, { recursive: true, force: true });
  options.signal?.throwIfAborted();
  return results;
};
