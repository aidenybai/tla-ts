(*---
description: "With -continue, simulation prints every violating behavior and runs on through num traces. This is a TLC bug: Simulator.simulate keeps only the last worker result, so TLC exits 0 after printing violations."
features: [tlc-bug]
ref: tlc2/tool/Simulator.java#simulate
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -simulate
  - num=2
  - -depth
  - "5"
  - -continue
correct:
  all:
    exit: 12
    transcript: |-
      2269:0 Computed 1 initial states...
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2110:1 Invariant Inv is violated.
      2121:1 The behavior up to this point is:
      2217:4 1: <Init line 49, col 9 to line 49, col 13 of module continue_multiple_traces>
      x = 0
      2217:4 2: <Next line 50, col 9 to line 50, col 18 of module continue_multiple_traces>
      x = 1
      2217:4 3: <Next line 50, col 9 to line 50, col 18 of module continue_multiple_traces>
      x = 2
      2209:0 Progress(2) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
      2210:0 The number of states generated: 5
      Simulation using seed 4 and aril 0
      2110:1 Invariant Inv is violated.
      2121:1 The behavior up to this point is:
      2217:4 1: <Init line 49, col 9 to line 49, col 13 of module continue_multiple_traces>
      x = 0
      2217:4 2: <Next line 50, col 9 to line 50, col 18 of module continue_multiple_traces>
      x = 1
      2217:4 3: <Next line 50, col 9 to line 50, col 18 of module continue_multiple_traces>
      x = 2
      2209:0 Progress(2) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
      2210:0 The number of states generated: 5
      Simulation using seed 4 and aril 0
      2209:0 Progress(2) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
---*)
---- MODULE continue_multiple_traces ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 49, col 9 to line 49, col 13 of module continue_multiple_traces>
    x = 0
    2217:4 2: <Next line 50, col 9 to line 50, col 18 of module continue_multiple_traces>
    x = 1
    2217:4 3: <Next line 50, col 9 to line 50, col 18 of module continue_multiple_traces>
    x = 2
    2209:0 Progress(2) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 5
    Simulation using seed 4 and aril 0
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 49, col 9 to line 49, col 13 of module continue_multiple_traces>
    x = 0
    2217:4 2: <Next line 50, col 9 to line 50, col 18 of module continue_multiple_traces>
    x = 1
    2217:4 3: <Next line 50, col 9 to line 50, col 18 of module continue_multiple_traces>
    x = 2
    2209:0 Progress(2) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 5
    Simulation using seed 4 and aril 0
    2209:0 Progress(2) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(2) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 5
    Simulation using seed 4 and aril 0
---*)
