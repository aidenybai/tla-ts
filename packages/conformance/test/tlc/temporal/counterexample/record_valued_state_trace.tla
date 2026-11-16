(*---
description: 'Lasso state printing handles non-scalars.'
ref: tlc2/tool/liveness/LiveWorker.java#printTrace
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE record_valued_state_trace ----
EXTENDS Naturals
VARIABLE x
Next == x' = [x EXCEPT !.a = 1 - @]
Spec == x = [a |-> 0, b |-> {1, 2}] /\ [][Next]_x /\ WF_x(Next)
Prop == <>[](x.a = 0)
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
    x = [a |-> 0, b |-> {1, 2}]
    2217:4 2: <Next line 14, col 9 to line 14, col 35 of module record_valued_state_trace>
    x = [a |-> 1, b |-> {1, 2}]
    2122:4 1: Back to state: <Next line 14, col 9 to line 14, col 35 of module record_valued_state_trace>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
