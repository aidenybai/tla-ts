(*---
description: An ALIAS applies to every state of a simulation trace.
ref: tlc2/tool/Simulator.java#printBehavior
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS A
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE alias_in_trace ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
A == [double |-> 2 * x]
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 19, col 9 to line 19, col 13 of module alias_in_trace>
    double = 0
    2217:4 2: <Next line 20, col 9 to line 20, col 18 of module alias_in_trace>
    double = 2
    2217:4 3: <Next line 20, col 9 to line 20, col 18 of module alias_in_trace>
    double = 4
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
---*)
