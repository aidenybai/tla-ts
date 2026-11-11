(*---
description: With several actions, simulation names the action of the partial successor.
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
---- MODULE unassigned_two_actions ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
A == x' = x
B == x' = x
Next == A \/ B
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2109:1 Successor state is not completely specified by action A of the next-state relation. The following variable is not defined: y.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 17, col 9 to line 17, col 22 of module unassigned_two_actions>
    /\ x = 0
    /\ y = 0
    2217:4 2: <A line 18, col 6 to line 18, col 11 of module unassigned_two_actions>
    /\ x = 0
    /\ y = null
    2209:0 Progress(1) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 1
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
---*)
