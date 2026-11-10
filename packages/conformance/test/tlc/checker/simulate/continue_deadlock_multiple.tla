(*---
description: "With -continue, simulation prints each deadlocked behavior. This is a TLC bug: Simulator.simulate keeps only the last worker result, so TLC exits 0 after printing violations."
ref: tlc2/tool/Simulator.java#simulate
features:
  - tlc-bug
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=2
  - -depth
  - "5"
  - -continue
correct:
  all:
    exit: 11
    transcript: |-
      2269:0 Computed 1 initial states...
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2114:1 Deadlock reached.
      2121:1 The behavior up to this point is:
      2217:4 1: <Init line 45, col 9 to line 45, col 13 of module continue_deadlock_multiple>
      x = 0
      2217:4 2: <Next line 46, col 9 to line 46, col 27 of module continue_deadlock_multiple>
      x = 1
      2209:0 Progress(2) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
      2210:0 The number of states generated: 3
      Simulation using seed 4 and aril 0
      2114:1 Deadlock reached.
      2121:1 The behavior up to this point is:
      2217:4 1: <Init line 45, col 9 to line 45, col 13 of module continue_deadlock_multiple>
      x = 0
      2217:4 2: <Next line 46, col 9 to line 46, col 27 of module continue_deadlock_multiple>
      x = 1
      2209:0 Progress(2) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
      2210:0 The number of states generated: 3
      Simulation using seed 4 and aril 0
      2209:0 Progress(2) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
---*)
---- MODULE continue_deadlock_multiple ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x < 1 /\ x' = x + 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 20, col 9 to line 20, col 13 of module continue_deadlock_multiple>
    x = 0
    2217:4 2: <Next line 21, col 9 to line 21, col 27 of module continue_deadlock_multiple>
    x = 1
    2209:0 Progress(2) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 20, col 9 to line 20, col 13 of module continue_deadlock_multiple>
    x = 0
    2217:4 2: <Next line 21, col 9 to line 21, col 27 of module continue_deadlock_multiple>
    x = 1
    2209:0 Progress(2) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
    2209:0 Progress(2) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(2) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
---*)
