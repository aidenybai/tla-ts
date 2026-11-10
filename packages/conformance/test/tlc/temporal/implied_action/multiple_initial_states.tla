(*---
description: 'The trace starts from the initial state that leads to the violation.'
ref: tlc2/tool/Worker.java#doNextCheckImplied
features: [liveness, implied-action]
outcome: liveness-violation
config: |
  SPECIFICATION Spec2
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE multiple_initial_states ----
EXTENDS Naturals
VARIABLE x
Next == x < 3 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x

Spec2 == x \in {5, 0} /\ [][Next]_x
Prop == [][x' # 1]_x
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2112:1 Action property Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module multiple_initial_states>
    x = 1
    2199:0 3 states generated, 3 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
