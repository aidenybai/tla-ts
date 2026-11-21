import { TlaProverError, TlaUnsupportedError } from "../../errors";

// Loaded at runtime so browser bundles leave them out. prove loads this module only in Node and Bun.
const fileSystem = process.getBuiltinModule("node:fs");
const operatingSystem = process.getBuiltinModule("node:os");
const path = process.getBuiltinModule("node:path");

export type TlapmResult =
  | { status: "proved"; prover: string }
  | { status: "trivial" }
  | { status: "failed"; reason: string };

interface TlapmOptions {
  signal?: AbortSignal;
  onResult?: (id: number, result: TlapmResult) => void;
}

export const getTlapmPaths = () =>
  (process.env.PATH ?? "")
    .split(path.delimiter)
    .map((directory) => path.join(directory, "tlapm"))
    .filter((tlapm) => fileSystem.existsSync(tlapm));

const MESSAGE_END = "@!!END";

const parseToolboxMessages = (text: string) =>
  text
    .split("@!!BEGIN\n")
    .slice(1)
    .flatMap((block) => {
      const end = block.indexOf(MESSAGE_END);
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

export const proveWithTlapm = async (
  name: string,
  modules: Map<string, string>,
  options: TlapmOptions,
) => {
  const tlapm = getTlapmPaths()[0];
  if (tlapm === undefined)
    throw new TlaUnsupportedError("The tlapm backend needs tlapm on your PATH.");
  const directory = fileSystem.mkdtempSync(path.join(operatingSystem.tmpdir(), "tla-ts-"));
  modules.forEach((source, moduleName) =>
    fileSystem.writeFileSync(path.join(directory, `${moduleName}.tla`), source),
  );
  const results = new Map<number, TlapmResult>();
  // Loaded on use, since the CLI's shared chunk holds this module and child_process is slow to load.
  const child = process
    .getBuiltinModule("node:child_process")
    .spawn(
      tlapm,
      ["--toolbox", "0", "0", "--cache-dir", path.join(directory, ".tlacache"), `${name}.tla`],
      { cwd: directory, stdio: ["ignore", "ignore", "pipe"] },
    );
  const kill = () => child.kill();
  options.signal?.addEventListener("abort", kill);
  let unparsed = "";
  child.stderr.on("data", (chunk: Buffer) => {
    const text = unparsed + chunk.toString("utf8");
    const end = text.lastIndexOf(MESSAGE_END);
    const parsedLength = end === -1 ? 0 : end + MESSAGE_END.length;
    unparsed = text.slice(parsedLength);
    parseToolboxMessages(text.slice(0, parsedLength)).forEach((fields) => {
      const result = getResult(fields);
      const id = Number(fields.get("id"));
      if (fields.get("type") !== "obligation" || !result) return;
      results.set(id, result);
      options.onResult?.(id, result);
    });
  });
  const failure = await new Promise<Error | undefined>((resolve) => {
    child.on("error", resolve);
    child.on("close", () => resolve(undefined));
  });
  options.signal?.removeEventListener("abort", kill);
  fileSystem.rmSync(directory, { recursive: true, force: true });
  options.signal?.throwIfAborted();
  if (failure) throw new TlaProverError(failure.message, failure);
  return results;
};
