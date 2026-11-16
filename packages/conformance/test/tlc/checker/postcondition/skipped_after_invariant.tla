(*---
description: A false POSTCONDITION after an invariant violation is reported but the exit stays as the violation's.
ref: tlc2/tool/Worker.java#doPostCheckAssumption
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  POSTCONDITION Post
---*)
---- MODULE skipped_after_invariant ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
Post == TLCGet("level") = 1
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module skipped_after_invariant>
    x = 1
    2217:4 3: <Next line 15, col 9 to line 15, col 18 of module skipped_after_invariant>
    x = 2
    2404:1 Postcondition Post at line 17, col 9 to line 17, col 27 of module skipped_after_invariant is false.
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
