(*---
description: 'An implied action violation on the way wins over a later deadlock.'
ref: tlc2/tool/Worker.java#doNext
features: [liveness, deadlock]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
---*)
---- MODULE implied_action_before_deadlock ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == [][x' < 2]_x
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
    2217:4 2: <Next line 13, col 9 to line 13, col 27 of module implied_action_before_deadlock>
    x = 1
    2217:4 3: <Next line 13, col 9 to line 13, col 27 of module implied_action_before_deadlock>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
