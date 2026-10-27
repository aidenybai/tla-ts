import dieHardConfig from "./specs/DieHard.cfg?raw";
import dieHardSpec from "./specs/DieHard.tla?raw";
import replicatedLogConfig from "./specs/ReplicatedLog.cfg?raw";
import replicatedLogSpec from "./specs/ReplicatedLog.tla?raw";
import staleShrinkConfig from "./specs/StaleShrink.cfg?raw";
import staleShrinkSpec from "./specs/StaleShrink.tla?raw";

export interface Example {
  name: string;
  description: string;
  spec: string;
  config: string;
}

export const EXAMPLES: Example[] = [
  {
    name: "DieHard",
    description: "Lamport's water jug puzzle",
    spec: dieHardSpec,
    config: dieHardConfig,
  },
  {
    name: "ReplicatedLog",
    description: "A log whose followers never catch up",
    spec: replicatedLogSpec,
    config: replicatedLogConfig,
  },
  {
    name: "StaleShrink",
    description: "A data-loss race in Holochain's DHT",
    spec: staleShrinkSpec,
    config: staleShrinkConfig,
  },
];
