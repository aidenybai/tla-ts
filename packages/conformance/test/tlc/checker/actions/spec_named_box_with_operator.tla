(*---
description: Spec == Init /\ [][A \/ B]_x names A and B individually.
ref: tlc2/tool/Action.java#getLocation
outcome: safety-violation
config: |
  SPECIFICATION Spec
  INVARIANT Inv
---*)
---- MODULE spec_named_box_with_operator ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
A == x' = 1
B == x' = 2
Spec == Init /\ [][A \/ B]_x
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
    2217:4 2: <A line 14, col 6 to line 14, col 11 of module spec_named_box_with_operator>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
