import dieHardConfig from "./specs/DieHard.cfg?raw";
import dieHardSpec from "./specs/DieHard.tla?raw";
import replicatedLogConfig from "./specs/ReplicatedLog.cfg?raw";
import replicatedLogSpec from "./specs/ReplicatedLog.tla?raw";
import staleShrinkConfig from "./specs/StaleShrink.cfg?raw";
import staleShrinkSpec from "./specs/StaleShrink.tla?raw";

export interface Example {
  name: string;
  spec: string;
  config: string;
}

export const EXAMPLES: Example[] = [
  { name: "DieHard", spec: dieHardSpec, config: dieHardConfig },
  { name: "ReplicatedLog", spec: replicatedLogSpec, config: replicatedLogConfig },
  { name: "StaleShrink", spec: staleShrinkSpec, config: staleShrinkConfig },
];
