(*---
description: An invariant that's a definition on a CONSTANT passes through the same path.
ref: tlc2/tool/ModelChecker.java#doNextCheckInvariants
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  CONSTANT K = 1
---*)
---- MODULE subscript_constant_operator_in_invariant ----
EXTENDS Naturals, TLC
VARIABLE x
CONSTANT K
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x < K
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
    2217:4 2: <Next line 16, col 9 to line 16, col 24 of module subscript_constant_operator_in_invariant>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
