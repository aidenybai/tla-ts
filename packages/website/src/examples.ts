import commitConfig from "../../tla-ts/tests/fixtures/commit/Commit.cfg?raw";
import commitSpec from "../../tla-ts/tests/fixtures/commit/Commit.tla?raw";
import counterConfig from "../../tla-ts/tests/fixtures/counter/Counter.cfg?raw";
import counterSpec from "../../tla-ts/tests/fixtures/counter/Counter.tla?raw";
import mutexConfig from "../../tla-ts/tests/fixtures/mutex/Mutex.cfg?raw";
import mutexSpec from "../../tla-ts/tests/fixtures/mutex/Mutex.tla?raw";
import queueConfig from "../../tla-ts/tests/fixtures/queue/Queue.cfg?raw";
import queueSpec from "../../tla-ts/tests/fixtures/queue/Queue.tla?raw";
import waterJugsConfig from "../../tla-ts/tests/fixtures/water-jugs/WaterJugs.cfg?raw";
import waterJugsSpec from "../../tla-ts/tests/fixtures/water-jugs/WaterJugs.tla?raw";

export interface Example {
  name: string;
  description: string;
  spec: string;
  config: string;
}

export const EXAMPLES: Example[] = [
  {
    name: "WaterJugs",
    description:
      "Measure 4 gallons with a 3 and a 5 gallon jug. The invariant fails and the trace is the solution.",
    spec: waterJugsSpec,
    config: waterJugsConfig,
  },
  {
    name: "Mutex",
    description: "Two processes take turns entering a critical section. Mutual exclusion holds.",
    spec: mutexSpec,
    config: mutexConfig,
  },
  {
    name: "Commit",
    description:
      "A coordinator commits or aborts across three participants. No participant disagrees.",
    spec: commitSpec,
    config: commitConfig,
  },
  {
    name: "Queue",
    description: "A bounded producer and consumer over sequences, cut off by a state constraint.",
    spec: queueSpec,
    config: queueConfig,
  },
  {
    name: "Counter",
    description: "A counter that stops at its limit, so the checker reports a deadlock.",
    spec: counterSpec,
    config: counterConfig,
  },
];
