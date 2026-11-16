(*---
description: A state with two parents traces back through the parent that generated it first.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE trace_uses_first_parent ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
ToOne == x = 0 /\ x' = 1
ToTwo == x = 0 /\ x' = 2
OneToBad == x = 1 /\ x' = 3
TwoToBad == x = 2 /\ x' = 3
Next == ToTwo \/ ToOne \/ OneToBad \/ TwoToBad
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
    2217:4 2: <ToTwo line 15, col 10 to line 15, col 24 of module trace_uses_first_parent>
    x = 2
    2217:4 3: <TwoToBad line 17, col 13 to line 17, col 27 of module trace_uses_first_parent>
    x = 3
    2199:0 4 states generated, 4 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
