(*---
description: 'With two branches out of x = 0, the cycle search walks both before the state it still needs, so the printed lasso is longer than the shortest cycle.'
ref: tlc2/tool/liveness/LiveWorker.java#printTrace
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE trace_cycle_search_backtracks ----
EXTENDS Naturals
VARIABLE x
Next == \/ x = 0 /\ x' \in {1, 3}
        \/ x = 1 /\ x' = 2
        \/ x = 2 /\ x' = 1
        \/ x = 1 /\ x' = 0
        \/ x = 3 /\ x' = 0
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>[](x # 3) \/ <>[](x # 2)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 4 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 12 to line 14, col 33 of module trace_cycle_search_backtracks>
    x = 1
    2217:4 3: <Next line 17, col 12 to line 17, col 26 of module trace_cycle_search_backtracks>
    x = 0
    2217:4 4: <Next line 14, col 12 to line 14, col 33 of module trace_cycle_search_backtracks>
    x = 3
    2217:4 5: <Next line 18, col 12 to line 18, col 26 of module trace_cycle_search_backtracks>
    x = 0
    2217:4 6: <Next line 14, col 12 to line 14, col 33 of module trace_cycle_search_backtracks>
    x = 1
    2217:4 7: <Next line 15, col 12 to line 15, col 26 of module trace_cycle_search_backtracks>
    x = 2
    2217:4 8: <Next line 16, col 12 to line 16, col 26 of module trace_cycle_search_backtracks>
    x = 1
    2122:4 1: Back to state: <Next line 17, col 12 to line 17, col 26 of module trace_cycle_search_backtracks>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 7 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
