import { existsSync, readFileSync } from "node:fs";

// "master" stands for the master builds that tla-ts follows for any other tla2tools.jar.
export type TlcVersion = "1.7.4" | "master";

const MANIFEST = "META-INF/MANIFEST.MF";

// fflate loads node:worker_threads, so only a run with a jar imports it.
export const getTlcVersion = async (jar: string | undefined): Promise<TlcVersion> => {
  if (jar === undefined || !existsSync(jar)) return "master";
  const fflate = await import("fflate");
  const manifest = fflate.unzipSync(readFileSync(jar), {
    filter: (file) => file.name === MANIFEST,
  })[MANIFEST];
  const tag = manifest && /^X-Git-Tag: *(\S*)/m.exec(fflate.strFromU8(manifest))?.[1];
  return tag === "v1.7.4" ? "1.7.4" : "master";
};
