(*---
description: A successor missing several variables uses the plural form in simulation.
ref: tlc2/tool/SimulationWorker.java#addElement
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE unassigned_many_variables ----
EXTENDS Naturals
VARIABLES x, y, z
Init == x = 0 /\ y = 0 /\ z = 0
Next == x = 0
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2109:1 Successor state is not completely specified by the next-state action. The following variables are not defined: x, y, z.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 17, col 9 to line 17, col 31 of module unassigned_many_variables>
    /\ x = 0
    /\ y = 0
    /\ z = 0
    2217:4 2: <Next line 18, col 9 to line 18, col 13 of module unassigned_many_variables>
    /\ x = null
    /\ y = null
    /\ z = null
    2209:0 Progress(1) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 1
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
---*)
