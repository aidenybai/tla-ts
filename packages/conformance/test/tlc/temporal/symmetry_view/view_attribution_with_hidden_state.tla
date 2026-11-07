(*---
description: 'Attribution re-evaluates the formula on the printed reconstructed states.'
ref: tlc2/tool/liveness/LiveWorker.java#printTrace
features: [liveness, view]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  VIEW Vw
  PROPERTY Prop
---*)
---- MODULE view_attribution_with_hidden_state ----
EXTENDS Naturals
VARIABLES x, h
Next == x' = (x + 1) % 2 /\ h' = (h + 1) % 3
Spec == x = 0 /\ h = 0 /\ [][Next]_<<x, h>> /\ WF_<<x, h>>(Next)
Vw == x
Prop == [](h = 0 \/ h = 1 \/ <>(x = 99))
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 2 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ h = 0
    /\ x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 44 of module view_attribution_with_hidden_state>
    /\ h = 1
    /\ x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 44 of module view_attribution_with_hidden_state>
    /\ h = 2
    /\ x = 0
    2217:4 4: <Next line 14, col 9 to line 14, col 44 of module view_attribution_with_hidden_state>
    /\ h = 0
    /\ x = 1
    2217:4 5: <Next line 14, col 9 to line 14, col 44 of module view_attribution_with_hidden_state>
    /\ h = 1
    /\ x = 0
    2122:4 4: Back to state: <Next line 14, col 9 to line 14, col 44 of module view_attribution_with_hidden_state>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
