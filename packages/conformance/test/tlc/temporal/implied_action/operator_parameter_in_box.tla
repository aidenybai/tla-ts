(*---
description: 'A formal parameter as the action of a PROPERTY box is evaluated lazily.'
ref: tlc2/tool/Worker.java#doNextCheckImplied
features: [liveness, implied-action]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE operator_parameter_in_box ----
EXTENDS Naturals
VARIABLE x
Next == x < 3 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Al(a) == [][a]_x
Prop == Al(x' = 99)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2112:1 Action property Al is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module operator_parameter_in_box>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
