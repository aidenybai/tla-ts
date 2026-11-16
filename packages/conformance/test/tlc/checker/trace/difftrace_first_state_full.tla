(*---
description: -difftrace prints the first state in full, even with several variables.
ref: tlc2/tool/TLCStateMut.java#toString
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -difftrace
---*)
---- MODULE difftrace_first_state_full ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 7
Next == x' = x + 1 /\ y' = y
Inv == x < 1
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 7
    2217:4 2: <Next line 16, col 9 to line 16, col 28 of module difftrace_first_state_full>
    /\ x = 1
    /\ y = 7
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
