(*---
description: A violating state reachable by a long and a short path prints the short path.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE shortest_counterexample_two_paths ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Long == x < 4 /\ x' = x + 1
Short == x = 0 /\ x' = 4
Next == Long \/ Short
Inv == x < 4
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
    2217:4 2: <Short line 15, col 10 to line 15, col 24 of module shortest_counterexample_two_paths>
    x = 4
    2199:0 3 states generated, 3 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
