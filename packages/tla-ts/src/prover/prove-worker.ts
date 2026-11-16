import { TlaProverError } from "../errors";
import { getParentPort } from "../worker";
import { decide } from "./deciders";
import type { DecideRequest, DecideResponse } from "./decide-pool";

const getResponse = (request: DecideRequest): DecideResponse => {
  try {
    return decide(request.prover, request.text, { timeLimitMs: request.timeLimitMs });
  } catch (error) {
    if (error instanceof TlaProverError) return { error: error.message };
    throw error;
  }
};

void getParentPort().then((parent) => {
  parent.addEventListener("message", (event) =>
    parent.postMessage(getResponse(event.data as DecideRequest)),
  );
  parent.start?.();
});
