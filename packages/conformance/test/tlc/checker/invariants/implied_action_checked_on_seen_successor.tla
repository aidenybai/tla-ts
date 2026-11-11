(*---
description: An implied action is checked even when the successor was seen, unlike an invariant.
ref: tlc2/tool/ModelChecker.java#doNextCheckImplied
outcome: liveness-violation
config: |
  INIT Init
  NEXT Next
  PROPERTY Prop
---*)
---- MODULE implied_action_checked_on_seen_successor ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1 - x
Prop == [][x' = 1]_x
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2112:1 Action property Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module implied_action_checked_on_seen_successor>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 18 of module implied_action_checked_on_seen_successor>
    x = 0
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
