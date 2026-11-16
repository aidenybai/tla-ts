(*---
description: Checks eventually on the two_cycles machine under weak_and_strong fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_two_cycles__weak_and_strong__eventually ----
EXTENDS Integers
VARIABLE x
Next == \/ x \in {0, 1} /\ x' = 1 - x
        \/ x = 1 /\ x' = 2
        \/ x = 2 /\ x' = 2
Spec == x = 0 /\ [][Next]_x /\ WF_x(x = 0 /\ Next) /\ SF_x(x = 1 /\ Next)
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 3 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 15, col 12 to line 15, col 37 of module live_two_cycles__weak_and_strong__eventually>
    x = 1
    2122:4 1: Back to state: <Next line 15, col 12 to line 15, col 37 of module live_two_cycles__weak_and_strong__eventually>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 5 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
