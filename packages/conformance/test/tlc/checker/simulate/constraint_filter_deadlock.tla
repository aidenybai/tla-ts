(*---
description: A state constraint removing every successor counts as deadlock in simulation, unlike in model checking.
ref: tlc2/tool/SimulationWorker.java#addElement
outcome: deadlock
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE constraint_filter_deadlock ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Con == x < 2
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 18, col 9 to line 18, col 13 of module constraint_filter_deadlock>
    x = 0
    2217:4 2: <Next line 19, col 9 to line 19, col 18 of module constraint_filter_deadlock>
    x = 1
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
---*)
