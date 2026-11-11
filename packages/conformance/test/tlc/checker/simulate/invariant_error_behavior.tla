(*---
description: An evaluation error in an invariant reports the invariant failure and the behavior in simulation.
ref: tlc2/tool/SimulationWorker.java#addElement
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE invariant_error_behavior ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == 1 \div (1 - x) >= 0
====

(*--- recorded
all:
  exit: 76
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2111:1 Evaluating invariant Inv failed.
    2179:0 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 18, col 9 to line 18, col 13 of module invariant_error_behavior>
    x = 0
    2217:4 2: <Next line 19, col 9 to line 19, col 18 of module invariant_error_behavior>
    x = 1
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 2
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
---*)
