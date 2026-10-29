// Proves a module's obligations with tla-ts's own provers, or with tlapm.

import { TlaUnsupportedError } from "./errors";
import { encodeObligation, type EncodingSession } from "./obligation-smt";
import { getObligations, type PrintedObligation } from "./obligations";
import { solveSmt } from "./solve-smt";
import { TLAPS_MODULE } from "./tlaps-module";

export type ProofStatus = "proved" | "trivial" | "failed" | "unsupported";

export interface ProofObligation {
  id: number;
  location: string;
  text: string;
  status: ProofStatus;
  reason?: string;
}

export interface ProveSummary {
  obligationCount: number;
  provedCount: number;
  trivialCount: number;
  failedCount: number;
  unsupportedCount: number;
  missingProofCount: number;
  omittedProofCount: number;
}

export interface ProveResult {
  obligations: ProofObligation[];
  summary: ProveSummary;
}

export interface ProveOptions {
  source: string;
  loadModule?: (name: string) => string | undefined;
  backend?: "tla-ts" | "tlapm";
  signal?: AbortSignal;
  onObligation?: (obligation: ProofObligation) => void;
}

const getModuleName = (source: string) => /-{4,}\s*MODULE\s+(\w+)/.exec(source)?.[1] ?? "Main";

const getSummary = (
  obligations: ProofObligation[],
  missingProofCount: number,
  omittedProofCount: number,
): ProveSummary => {
  const count = (status: ProofStatus) =>
    obligations.filter((obligation) => obligation.status === status).length;
  return {
    obligationCount: obligations.length,
    provedCount: count("proved"),
    trivialCount: count("trivial"),
    failedCount: count("failed"),
    unsupportedCount: count("unsupported"),
    missingProofCount,
    omittedProofCount,
  };
};

const getResult = (
  obligation: PrintedObligation,
  status: ProofStatus,
  reason?: string,
): ProofObligation => ({
  id: obligation.id,
  location: obligation.location,
  text: obligation.text,
  status,
  ...(reason === undefined ? {} : { reason }),
});

// tlapm's default method: the trivial check, then the SMT solver.
const proveWithTlaTs = (obligation: PrintedObligation, session: EncodingSession) => {
  if (obligation.kind.kind === "Error") return getResult(obligation, "failed", obligation.text);
  const encoded = encodeObligation(obligation.sequent, obligation.kind, session);
  const encoding = encoded.encoding;
  if (encoding.kind === "trivial") return getResult(obligation, "trivial");
  if (encoding.kind === "unsupported") return getResult(obligation, "unsupported", encoding.reason);
  const answer = solveSmt(encoding.script, { timeLimitMs: encoded.timeLimitMs });
  if (answer === "unsat") return getResult(obligation, "proved");
  if (encoding.omitted !== undefined)
    return getResult(
      obligation,
      "unsupported",
      `the SMT solver answered ${answer} without a hypothesis using ${encoding.omitted}`,
    );
  return getResult(obligation, "failed", `the SMT solver answered ${answer}`);
};

interface ToolboxMessage {
  fields: Map<string, string>;
}

// tlapm's Toolbox protocol: each message is @!!BEGIN, then @!!name:value lines, then @!!END.
const parseToolboxMessages = (text: string): ToolboxMessage[] =>
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
      return [{ fields }];
    });

const TLAPM_STATUSES: Record<string, ProofStatus> = {
  proved: "proved",
  trivial: "trivial",
  failed: "failed",
  interrupted: "failed",
};

const proveWithTlapm = async (
  name: string,
  modules: Map<string, string>,
  obligations: PrintedObligation[],
  options: ProveOptions,
) => {
  if (typeof process === "undefined" || process.versions?.node === undefined)
    throw new TlaUnsupportedError("The tlapm backend runs only in Node and Bun.");
  const paths = await import("./tlapm-path");
  const tlapm = paths.getTlapmPaths()[0];
  if (tlapm === undefined)
    throw new TlaUnsupportedError("The tlapm backend needs tlapm on your PATH.");
  const childProcess = await import("node:child_process");
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tla-ts-"));
  modules.forEach((source, moduleName) =>
    fs.writeFileSync(path.join(directory, `${moduleName}.tla`), source),
  );
  const byId = new Map(obligations.map((obligation) => [obligation.id, obligation]));
  const results = new Map<number, ProofObligation>();
  const child = childProcess.spawn(
    tlapm,
    ["--toolbox", "0", "0", "--cache-dir", path.join(directory, ".tlacache"), `${name}.tla`],
    { cwd: directory, stdio: ["ignore", "ignore", "pipe"] },
  );
  const kill = () => child.kill();
  options.signal?.addEventListener("abort", kill);
  const output = { text: "", parsed: 0 };
  child.stderr.on("data", (chunk: Buffer) => {
    output.text += chunk.toString("utf8");
    const messages = parseToolboxMessages(output.text);
    messages.slice(output.parsed).forEach((message) => {
      const status = TLAPM_STATUSES[message.fields.get("status") ?? ""];
      const obligation = byId.get(Number(message.fields.get("id")));
      if (message.fields.get("type") !== "obligation" || !status || !obligation) return;
      const result = getResult(obligation, status, message.fields.get("reason") || undefined);
      results.set(obligation.id, result);
      options.onObligation?.(result);
    });
    output.parsed = messages.length;
  });
  await new Promise((resolve) => child.on("close", resolve));
  options.signal?.removeEventListener("abort", kill);
  fs.rmSync(directory, { recursive: true, force: true });
  options.signal?.throwIfAborted();
  return obligations.map(
    (obligation) =>
      results.get(obligation.id) ??
      getResult(obligation, "unsupported", "tlapm reported no result"),
  );
};

export const prove = async (options: ProveOptions): Promise<ProveResult> => {
  const name = getModuleName(options.source);
  const modules = new Map<string, string>();
  const results = getObligations(
    [{ file: `${name}.tla`, source: options.source }],
    (moduleName) => {
      const source = options.loadModule?.(moduleName);
      if (source !== undefined) modules.set(moduleName, source);
      const loaded = source ?? (moduleName === "TLAPS" ? TLAPS_MODULE : undefined);
      return loaded === undefined ? undefined : { file: `${moduleName}.tla`, source: loaded };
    },
  );
  const obligations = results.flatMap((result) => result.obligations);
  const missing = results.reduce((total, result) => total + result.summary.absent.length, 0);
  const omitted = results.reduce((total, result) => total + result.summary.omitted.length, 0);
  if (options.backend === "tlapm") {
    const proved = await proveWithTlapm(
      name,
      new Map([[name, options.source], ...modules]),
      obligations,
      options,
    );
    return { obligations: proved, summary: getSummary(proved, missing, omitted) };
  }
  const proved: ProofObligation[] = [];
  const session = { caseErrors: 0 };
  for (const obligation of obligations) {
    options.signal?.throwIfAborted();
    const result = proveWithTlaTs(obligation, session);
    proved.push(result);
    options.onObligation?.(result);
    // HACK: the solver runs synchronously, so yield to the event loop to let an abort land.
    await new Promise((resolve) => setTimeout(resolve));
  }
  return { obligations: proved, summary: getSummary(proved, missing, omitted) };
};
