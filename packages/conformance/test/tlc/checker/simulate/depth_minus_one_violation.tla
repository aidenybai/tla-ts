(*---
description: With -depth -1 the trace depth is unbounded, and a violation prints only the error state.
ref: tlc2/tool/Simulator.java#printBehavior
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -simulate
  - num=1
  - -depth
  - "-1"
---*)
---- MODULE depth_minus_one_violation ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2120:0 The error state is:
    2216:4 :
    x = 2
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
---*)
