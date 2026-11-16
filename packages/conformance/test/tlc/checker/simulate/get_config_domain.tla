(*---
description: TLCGet("config") in simulation has its own fields.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "2"
---*)
---- MODULE get_config_domain ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1 /\ PrintT(DOMAIN TLCGet("config"))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | { "install",
    |   "mode",
    |   "deadlock",
    |   "seed",
    |   "worker",
    |   "traces",
    |   "depth",
    |   "aril",
    |   "sched" }
    | { "install",
    |   "mode",
    |   "deadlock",
    |   "seed",
    |   "worker",
    |   "traces",
    |   "depth",
    |   "aril",
    |   "sched" }
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
---*)
