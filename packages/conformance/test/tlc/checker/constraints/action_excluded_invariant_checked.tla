(*---
description: An invariant is checked on a successor even if the action constraint excludes it.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ACTION_CONSTRAINT Con
---*)
---- MODULE action_excluded_invariant_checked ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Con == x' < 1
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
    x = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module action_excluded_invariant_checked>
    x = 1
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
