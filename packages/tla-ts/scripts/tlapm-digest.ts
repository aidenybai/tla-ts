import { createHash } from "node:crypto";
import { join } from "node:path";
import { CONFORMANCE_DIRECTORY } from "./corpora";

export interface TlapmObligation {
  loc: string;
  text: string;
}

export interface TlapmResult {
  id: string;
  status: "ok" | "error";
  error?: string;
  obligations?: TlapmObligation[];
}

export interface TlapmDigest {
  id: string;
  status: "ok" | "error";
  error?: string;
  obligations?: { loc: string; text: string; layout: string }[];
}

export const TLAPM_PATH = join(CONFORMANCE_DIRECTORY, "tlapm.json");

export const TLAPM_TEXT_PATH = join(CONFORMANCE_DIRECTORY, ".tlapm.json");

export const getDigest = (text: string) =>
  createHash("sha256").update(text).digest("hex").slice(0, 16);

export const collapseWhitespace = (text: string) => text.split(/\s+/).join(" ").trim();
