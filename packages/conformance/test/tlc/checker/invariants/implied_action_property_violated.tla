(*---
description: A [][A]_x property is checked on each step and reports the action property violation with exit status for liveness.
ref: tlc2/tool/ModelChecker.java#doNextCheckImplied
outcome: liveness-violation
config: |
  INIT Init
  NEXT Next
  PROPERTY Prop
---*)
---- MODULE implied_action_property_violated ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Prop == [][x' = x + 1]_x
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
    2217:4 2: <Next line 14, col 9 to line 14, col 24 of module implied_action_property_violated>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 24 of module implied_action_property_violated>
    x = 2
    2217:4 4: <Next line 14, col 9 to line 14, col 24 of module implied_action_property_violated>
    x = 0
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
