(*---
description: With constraints, the counterexample is still the shortest within the constrained model.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  CONSTRAINT Con
---*)
---- MODULE constraint_trace_shortest ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' \in {x + 1, x + 2}
Con == x # 2
Inv == x < 3
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
    2217:4 2: <Next line 15, col 9 to line 15, col 29 of module constraint_trace_shortest>
    x = 1
    2217:4 3: <Next line 15, col 9 to line 15, col 29 of module constraint_trace_shortest>
    x = 3
    2199:0 5 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
