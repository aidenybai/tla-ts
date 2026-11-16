(*---
description: TLCGet("stats") counts traces and generated states in simulation.
ref: tlc2/tool/Simulator.java#getStatistics
features:
  - TLC
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -simulate
  - num=1
  - -depth
  - "3"
---*)
---- MODULE simulate_stats_fields ----
EXTENDS TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == LET s == TLCGet("stats") IN PrintT([traces |-> s.traces, generated |-> s.generated, worker |-> s.worker])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    | [traces |-> 0, generated |-> 1, worker |-> 0]
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | [traces |-> 1, generated |-> 2, worker |-> 0]
    | [traces |-> 1, generated |-> 3, worker |-> 0]
    | [traces |-> 1, generated |-> 4, worker |-> 0]
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 4
    Simulation using seed 4 and aril 0
---*)
