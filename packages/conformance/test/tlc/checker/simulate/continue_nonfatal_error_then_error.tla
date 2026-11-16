(*---
description: With -continue, an unassigned variable, which is fatal, stops simulation.
ref: tlc2/tool/Simulator.java#simulate
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=2
  - -depth
  - "2"
  - -continue
---*)
---- MODULE continue_nonfatal_error_then_error ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x' = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2109:1 Successor state is not completely specified by the next-state action. The following variable is not defined: y.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 18, col 9 to line 18, col 22 of module continue_nonfatal_error_then_error>
    /\ x = 0
    /\ y = 0
    2217:4 2: <Next line 19, col 9 to line 19, col 14 of module continue_nonfatal_error_then_error>
    /\ x = 0
    /\ y = null
    2209:0 Progress(2) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 1
    Simulation using seed 4 and aril 0
    2209:0 Progress(2) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
---*)
