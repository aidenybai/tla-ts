(*---
description: Simulation checks invariants on a successor before the constraint can remove it.
ref: tlc2/tool/SimulationWorker.java#addElement
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  CONSTRAINT Con
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE constraint_filter_after_invariant ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Con == x < 1
Inv == x < 1
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 19, col 9 to line 19, col 13 of module constraint_filter_after_invariant>
    x = 0
    2217:4 2: <Next line 20, col 9 to line 20, col 18 of module constraint_filter_after_invariant>
    x = 1
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 2
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
---*)
