(*---
description: 'The cycle search in printTrace skips an edge of the component that fails the EA action, so the printed cycle avoids the 0 to 2 shortcut.'
ref: tlc2/tool/liveness/LiveWorker.java#printTrace
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE trace_skips_edge_failing_ea_action ----
EXTENDS Naturals
VARIABLE x
Next == \/ x = 0 /\ x' = 2
        \/ x' = (x + 1) % 3
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == []<>(LET a == x = 0 /\ x' = 2 IN a) \/ <>[](x # 1)
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
    2217:4 2: <Next line 15, col 12 to line 15, col 27 of module trace_skips_edge_failing_ea_action>
    x = 1
    2217:4 3: <Next line 15, col 12 to line 15, col 27 of module trace_skips_edge_failing_ea_action>
    x = 2
    2122:4 1: Back to state: <Next line 15, col 12 to line 15, col 27 of module trace_skips_edge_failing_ea_action>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 5 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
