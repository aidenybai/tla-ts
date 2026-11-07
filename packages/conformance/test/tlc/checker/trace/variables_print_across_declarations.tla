(*---
description: "Variables from two VARIABLE statements also print in sorted name order."
ref: tlc2/tool/TLCStateMut.java#toString
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE variables_print_across_declarations ----
EXTENDS Naturals
VARIABLE b
VARIABLE a
Init == b = 0 /\ a = 1
Next == b' = 1 /\ a' = a
Inv == b = 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ a = 1
    /\ b = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 24 of module variables_print_across_declarations>
    /\ a = 1
    /\ b = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
