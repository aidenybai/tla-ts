(*---
description: A liveness property that holds doesn't change simulation's outcome.
ref: tlc2/tool/Simulator.java#simulate
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
args:
  - -simulate
  - num=1
  - -depth
  - "8"
---*)
---- MODULE liveness_holds ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1 - x
Spec == Init /\ [][Next]_x /\ WF_x(Next)
Prop == []<>(x = 1)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(1) at <date>: 9 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 9 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 9
    Simulation using seed 4 and aril 0
---*)
