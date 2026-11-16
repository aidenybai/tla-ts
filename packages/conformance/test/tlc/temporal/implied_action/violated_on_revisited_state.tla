(*---
description: 'An implied action is checked even when the successor has already been seen.'
ref: tlc2/tool/Worker.java#doNextCheckImplied
features: [liveness, implied-action]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE violated_on_revisited_state ----
EXTENDS Naturals
VARIABLE x
Next == x' = (x + 1) % 3
Spec == x = 0 /\ [][Next]_x
Prop == [][x' > x]_x
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
    2217:4 2: <Next line 14, col 9 to line 14, col 24 of module violated_on_revisited_state>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 24 of module violated_on_revisited_state>
    x = 2
    2217:4 4: <Next line 14, col 9 to line 14, col 24 of module violated_on_revisited_state>
    x = 0
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
