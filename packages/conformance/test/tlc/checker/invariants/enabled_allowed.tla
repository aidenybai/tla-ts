(*---
description: An invariant can use ENABLED, which is state-level.
ref: tlc2/tool/ModelChecker.java#doNextCheckInvariants
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  CHECK_DEADLOCK FALSE
---*)
---- MODULE enabled_allowed ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x < 1 /\ x' = x + 1
Inv == ENABLED Next
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
    2217:4 2: <Next line 15, col 9 to line 15, col 27 of module enabled_allowed>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
