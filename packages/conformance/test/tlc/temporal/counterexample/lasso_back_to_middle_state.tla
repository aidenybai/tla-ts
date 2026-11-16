(*---
description: 'A prefix leading into a cycle ends with the state number where the cycle starts.'
ref: tlc2/tool/liveness/LiveWorker.java#printTrace
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE lasso_back_to_middle_state ----
EXTENDS Naturals
VARIABLE x
Enter == x = 0 /\ x' = 1
Loop == x > 0 /\ x' = 3 - x
Spec == x = 0 /\ [][Enter \/ Loop]_x /\ WF_x(Enter \/ Loop)
Prop == <>[](x = 2)
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
    2217:4 2: <Enter line 14, col 10 to line 14, col 24 of module lasso_back_to_middle_state>
    x = 1
    2217:4 3: <Loop line 15, col 9 to line 15, col 27 of module lasso_back_to_middle_state>
    x = 2
    2122:4 2: Back to state: <Loop line 15, col 9 to line 15, col 27 of module lasso_back_to_middle_state>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
