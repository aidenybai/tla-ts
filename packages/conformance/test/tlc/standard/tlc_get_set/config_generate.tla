(*---
description: With -generate, the mode is generate.
ref: tlc2/tool/Simulator.java#createConfig
features:
  - TLC
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -generate
  - num=1
  - -depth
  - "2"
---*)
---- MODULE config_generate ----
EXTENDS TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == PrintT(TLCGet("config").mode)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    | "generate"
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | "generate"
    | "generate"
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
---*)
