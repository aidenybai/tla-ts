(*---
description: TLCGet("stats").traces in simulation counts the traces started.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=2
  - -depth
  - "1"
---*)
---- MODULE get_stats_traces ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1 /\ PrintT(TLCGet("stats").traces)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 1
    | 2
    2209:0 Progress(2) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(2) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
---*)
