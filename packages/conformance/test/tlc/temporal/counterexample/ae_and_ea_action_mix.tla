(*---
description: 'One possible error model can mix an AE and an EA action.'
ref: tlc2/tool/liveness/LiveWorker.java#checkComponent
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE ae_and_ea_action_mix ----
EXTENDS Naturals
VARIABLE x
Next == x' = (x + 1) % 3
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>[](LET a == x' # 0 IN a) \/ []<>(LET b == x' = 99 IN b)
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
    2217:4 2: <Next line 14, col 9 to line 14, col 24 of module ae_and_ea_action_mix>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 24 of module ae_and_ea_action_mix>
    x = 2
    2122:4 1: Back to state: <Next line 14, col 9 to line 14, col 24 of module ae_and_ea_action_mix>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
