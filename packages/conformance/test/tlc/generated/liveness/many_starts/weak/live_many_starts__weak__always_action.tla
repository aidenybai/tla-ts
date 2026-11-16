(*---
description: Checks always_action on the many_starts machine under weak fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_many_starts__weak__always_action ----
EXTENDS Integers
VARIABLE x
Next == x' = (x + 1) % 3
Spec == x \in 0..2 /\ [][Next]_x /\ WF_x(Next)
Prop == [][x' >= x]_x
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2269:0 Computed 2 initial states...
    2190:0 Finished computing initial states: 3 distinct states generated at <date>.
    2112:1 Action property Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 2
    2217:4 2: <Next line 15, col 9 to line 15, col 24 of module live_many_starts__weak__always_action>
    x = 0
    2199:0 6 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
