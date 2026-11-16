(*---
description: Trace reconstruction finds the first initial state with the fingerprint, and a duplicate later disjunct still evaluates.
ref: tlc2/tool/impl/Tool.java#getState
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE first_of_duplicate_for_trace ----
EXTENDS Naturals, TLC
VARIABLE x
Init == (x = 0 /\ PrintT("a")) \/ (x = 0 /\ PrintT("b"))
Next == x' = x + 1
Inv == x < 1
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    | "a"
    | "b"
    2191:0 Finished computing initial states: 2 states generated, with 1 of them distinct at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module first_of_duplicate_for_trace>
    x = 1
    | "a"
    | "b"
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
