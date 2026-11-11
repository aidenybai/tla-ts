(*---
description: An invariant comparing a variable's value of another kind fails with the equality error and the trace.
ref: tlc2/tool/ModelChecker.java#doNextCheckInvariants
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE set_vs_integer_invariant_fails_equality ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = "a"
Inv == x = 0
====

(*--- recorded
all:
  exit: 76
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2111:1 Evaluating invariant Inv failed.
    Attempted to check equality of string "a" with non-string:
    0
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 16 of module set_vs_integer_invariant_fails_equality>
    x = "a"
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).
---*)
