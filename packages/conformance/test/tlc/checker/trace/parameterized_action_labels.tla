(*---
description: Each trace step shows the parameters of the action that took it.
ref: tlc2/tool/Action.java#getLocation
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE parameterized_action_labels ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
A(i) == x' = x + i
Next == \E i \in 1..2 : A(i)
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
    2217:4 2: <A(1) line 14, col 9 to line 14, col 18 of module parameterized_action_labels>
    x = 1
    2217:4 3: <A(2) line 14, col 9 to line 14, col 18 of module parameterized_action_labels>
    x = 3
    2199:0 5 states generated, 4 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
