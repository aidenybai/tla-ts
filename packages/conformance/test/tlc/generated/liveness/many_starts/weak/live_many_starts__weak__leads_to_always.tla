(*---
description: Checks leads_to_always on the many_starts machine under weak fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_many_starts__weak__leads_to_always ----
EXTENDS Integers
VARIABLE x
Next == x' = (x + 1) % 3
Spec == x \in 0..2 /\ [][Next]_x /\ WF_x(Next)
Prop == (x = 1) ~> [](x = 1)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2269:0 Computed 2 initial states...
    2190:0 Finished computing initial states: 3 distinct states generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 3 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 1
    2217:4 2: <Next line 15, col 9 to line 15, col 24 of module live_many_starts__weak__leads_to_always>
    x = 2
    2217:4 3: <Next line 15, col 9 to line 15, col 24 of module live_many_starts__weak__leads_to_always>
    x = 0
    2122:4 1: Back to state: <Next line 15, col 9 to line 15, col 24 of module live_many_starts__weak__leads_to_always>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 6 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
