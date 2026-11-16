(*---
description: A simulated trace is a function of the seed, pinned here through the trace of a violation.
ref: tlc2/tool/Simulator.java
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -simulate
  - num=1
  - -seed
  - "7"
---*)
---- MODULE simulate_trace_depends_on_seed ----
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
    2217:4 1: <Init line 18, col 9 to line 18, col 13 of module simulate_trace_depends_on_seed>
    x = 0
    2217:4 2: <Next line 19, col 9 to line 19, col 36 of module simulate_trace_depends_on_seed>
    x = 1
    2217:4 3: <Next line 19, col 9 to line 19, col 36 of module simulate_trace_depends_on_seed>
    x = 2
    2217:4 4: <Next line 19, col 9 to line 19, col 36 of module simulate_trace_depends_on_seed>
    x = 3
    2217:4 5: <Next line 19, col 9 to line 19, col 36 of module simulate_trace_depends_on_seed>
    x = 4
    2217:4 6: <Next line 19, col 9 to line 19, col 36 of module simulate_trace_depends_on_seed>
    x = 6
    2217:4 7: <Next line 19, col 9 to line 19, col 36 of module simulate_trace_depends_on_seed>
    x = 9
    2217:4 8: <Next line 19, col 9 to line 19, col 36 of module simulate_trace_depends_on_seed>
    x = 10
    2209:0 Progress(1) at <date>: 20 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 20
    Simulation using seed 7 and aril 0
    2209:0 Progress(1) at <date>: 20 states generated, -1 distinct states found, -1 states left on queue.
---*)
