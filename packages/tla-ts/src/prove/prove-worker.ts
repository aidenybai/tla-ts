// A worker of the decide pool: it decides each request with the backend its prover selects.

import { TlaProverError, TlaUnsupportedError } from "../errors";
import { getParentPort } from "../worker";
import { DECIDERS } from "./deciders";
import type { DecideRequest, DecideResponse } from "./decide-pool";

const getResponse = (request: DecideRequest): DecideResponse => {
  try {
    return {
      verdict: DECIDERS[request.prover](request.text, { timeLimitMs: request.timeLimitMs }),
    };
  } catch (error) {
    if (error instanceof TlaProverError) {
      return { error: { name: "TlaProverError", message: error.message } };
    }
    if (error instanceof TlaUnsupportedError) {
      return { error: { name: "TlaUnsupportedError", message: error.message } };
    }
    throw error;
  }
};

void getParentPort().then((parent) => {
  parent.addEventListener("message", (event) =>
    parent.postMessage(getResponse(event.data as DecideRequest)),
  );
  parent.start?.();
});
