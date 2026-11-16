(*---
description: Invariants evaluate in config order, so the first listed violated invariant is the one reported even if alphabetically later.
ref: tlc2/tool/ModelChecker.java#doNextCheckInvariants
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT B A
---*)
---- MODULE config_order_first ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
A == x < 1
B == x < 1
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant B is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 24 of module config_order_first>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
