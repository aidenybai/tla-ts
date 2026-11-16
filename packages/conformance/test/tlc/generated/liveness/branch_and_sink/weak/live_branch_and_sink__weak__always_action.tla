(*---
description: Checks always_action on the branch_and_sink machine under weak fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_branch_and_sink__weak__always_action ----
EXTENDS Integers
VARIABLE x
Next == \/ x = 0 /\ x' \in {1, 2}
        \/ x = 1 /\ x' = 0
        \/ x = 2 /\ x' = 2
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == [][x' >= x]_x
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
    2217:4 2: <Next line 15, col 12 to line 15, col 33 of module live_branch_and_sink__weak__always_action>
    x = 1
    2217:4 3: <Next line 16, col 12 to line 16, col 26 of module live_branch_and_sink__weak__always_action>
    x = 0
    2199:0 4 states generated, 3 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
