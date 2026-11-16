(*---
description: "-difftrace keeps the sorted name order among the changed variables."
ref: tlc2/tool/TLCStateMut.java#toString
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -difftrace
---*)
---- MODULE difftrace_ordering_preserved ----
EXTENDS Naturals
VARIABLES c, b, a
Init == c = 0 /\ b = 0 /\ a = 0
Next == c' = 1 /\ a' = 1 /\ b' = b
Inv == c = 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ a = 0
    /\ b = 0
    /\ c = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 34 of module difftrace_ordering_preserved>
    /\ a = 1
    /\ b = 0
    /\ c = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
