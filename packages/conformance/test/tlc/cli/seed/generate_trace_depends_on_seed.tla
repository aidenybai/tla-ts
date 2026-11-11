(*---
description: -generate sets the probabilistic mode, pinned through the trace of a violation.
ref: tlc2/TLC.java#handleParameters
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -generate
  - num=1
  - -seed
  - "7"
---*)
---- MODULE generate_trace_depends_on_seed ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' \in {x + 1, x + 2, x + 3}
Inv == x < 10
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 18, col 9 to line 18, col 13 of module generate_trace_depends_on_seed>
    x = 0
    2217:4 2: <Next line 19, col 9 to line 19, col 36 of module generate_trace_depends_on_seed>
    x = 1
    2217:4 3: <Next line 19, col 9 to line 19, col 36 of module generate_trace_depends_on_seed>
    x = 2
    2217:4 4: <Next line 19, col 9 to line 19, col 36 of module generate_trace_depends_on_seed>
    x = 5
    2217:4 5: <Next line 19, col 9 to line 19, col 36 of module generate_trace_depends_on_seed>
    x = 8
    2217:4 6: <Next line 19, col 9 to line 19, col 36 of module generate_trace_depends_on_seed>
    x = 10
    2209:0 Progress(1) at <date>: 6 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 6
    Simulation using seed 7 and aril 0
    2209:0 Progress(1) at <date>: 6 states generated, -1 distinct states found, -1 states left on queue.
---*)
