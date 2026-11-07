(*---
description: A violation within the depth is reported.
ref: tlc2/tool/Simulator.java
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -simulate
  - num=1
  - -depth
  - "10"
---*)
---- MODULE simulation_reaches_violation_within_depth ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 3
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 18, col 9 to line 18, col 13 of module simulation_reaches_violation_within_depth>
    x = 0
    2217:4 2: <Next line 19, col 9 to line 19, col 18 of module simulation_reaches_violation_within_depth>
    x = 1
    2217:4 3: <Next line 19, col 9 to line 19, col 18 of module simulation_reaches_violation_within_depth>
    x = 2
    2217:4 4: <Next line 19, col 9 to line 19, col 18 of module simulation_reaches_violation_within_depth>
    x = 3
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 4
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
---*)
