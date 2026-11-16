(*---
description: 'On the same step an implied action fails first, with exit 13.'
ref: tlc2/tool/liveness/LiveCheck.java#printErrorTrace
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY P1 P2
  CHECK_DEADLOCK FALSE
---*)
---- MODULE safety_like_implied_action_preempts ----
EXTENDS Naturals, TLC
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
P1 == [][x' < 1]_x
P2 == [](x = 1 => [](x = 1))
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2112:1 Action property P1 is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module safety_like_implied_action_preempts>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
