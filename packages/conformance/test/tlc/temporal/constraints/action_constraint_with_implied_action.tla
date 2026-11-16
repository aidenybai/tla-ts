(*---
description: 'An implied action is still checked on a step the action constraint removes.'
ref: tlc2/tool/ModelChecker.java#doNext
features: [liveness, constraint]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  ACTION_CONSTRAINT Ac
---*)
---- MODULE action_constraint_with_implied_action ----
EXTENDS Naturals
VARIABLE x
Next == x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Con == x <= 2
Ac == x' < 1
Prop == [][x' < 1]_x
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
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module action_constraint_with_implied_action>
    x = 1
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
