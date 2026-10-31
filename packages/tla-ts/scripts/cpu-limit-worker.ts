import { parentPort } from "node:worker_threads";
import { TlaError } from "../src";
import { DECIDERS } from "../src/prove/deciders";

interface Request {
  prover: string;
  text: string;
}

// Decides each input cpu-limit.ts sends with the backend of the named prover, with no time limit of
// its own: cpu-limit.ts terminates this thread once the limit has passed. A backend that rejects its
// input answers unknown, as tlapm counts that as a failure.
parentPort?.on("message", (request: Request) => {
  try {
    parentPort?.postMessage(
      DECIDERS[request.prover](request.text, { timeLimitMs: Number.POSITIVE_INFINITY }),
    );
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    parentPort?.postMessage("unknown");
  }
});
parentPort?.postMessage("ready");
