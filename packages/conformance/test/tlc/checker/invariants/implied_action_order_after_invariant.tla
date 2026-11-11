(*---
description: An invariant on a successor is checked before an implied action.
ref: tlc2/tool/ModelChecker.java#doNextCheckImplied
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  PROPERTY Prop
---*)
---- MODULE implied_action_order_after_invariant ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1
Inv == x = 0
Prop == [][FALSE]_x
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
    2217:4 2: <Next line 15, col 9 to line 15, col 14 of module implied_action_order_after_invariant>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
