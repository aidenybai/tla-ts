(*---
description: A false postcondition after a deadlock in simulation keeps the deadlock's status, which is higher.
ref: tlc2/tool/Simulator.java#simulate
outcome: deadlock
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE postcondition_false_after_deadlock ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x < 1 /\ x' = x + 1
Post == TLCGet("level") = 1
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 18, col 9 to line 18, col 13 of module postcondition_false_after_deadlock>
    x = 0
    2217:4 2: <Next line 19, col 9 to line 19, col 27 of module postcondition_false_after_deadlock>
    x = 1
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 2
    Simulation using seed 4 and aril 0
    2404:1 Postcondition Post at line 20, col 9 to line 20, col 27 of module postcondition_false_after_deadlock is false.
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
---*)
