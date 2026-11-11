(*---
description: The -modelcheck branch only advances the index, so it doesn't undo an earlier -simulate, and no state-graph summary appears.
ref: tlc2/TLC.java#handleParameters
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -simulate
  - num=1
  - -modelcheck
---*)
---- MODULE does_not_cancel_simulate ----
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
    2217:4 1: <Init line 17, col 9 to line 17, col 13 of module does_not_cancel_simulate>
    x = 0
    2217:4 2: <Next line 18, col 9 to line 18, col 18 of module does_not_cancel_simulate>
    x = 1
    2217:4 3: <Next line 18, col 9 to line 18, col 18 of module does_not_cancel_simulate>
    x = 2
    2217:4 4: <Next line 18, col 9 to line 18, col 18 of module does_not_cancel_simulate>
    x = 3
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 4
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
---*)
