(*---
description: "Trace states list variables in sorted name order, not declaration order."
ref: tlc2/tool/TLCStateMut.java#toString
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE variables_print_in_declaration_order ----
EXTENDS Naturals
VARIABLES z, b, m
Init == z = 0 /\ b = 1 /\ m = 2
Next == z' = 1 /\ b' = b /\ m' = m
Inv == z = 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ b = 1
    /\ m = 2
    /\ z = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 34 of module variables_print_in_declaration_order>
    /\ b = 1
    /\ m = 2
    /\ z = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
