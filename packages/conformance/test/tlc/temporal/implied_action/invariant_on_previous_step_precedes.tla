(*---
description: 'An implied action failing one step before an invariant wins.'
ref: tlc2/tool/Worker.java#doNext
features: [liveness, implied-action]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  INVARIANT Inv
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE invariant_on_previous_step_precedes ----
EXTENDS Naturals
VARIABLE x
Next == x < 3 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Inv == x < 2
Prop == [][x' = 99]_x
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
    2217:4 2: <Next line 15, col 9 to line 15, col 27 of module invariant_on_previous_step_precedes>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
