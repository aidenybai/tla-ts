(*---
description: 'A trace that closes a cycle is reported as a lasso by printTrace.'
ref: tlc2/tool/liveness/LiveCheck1.java#checkTrace
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -simulate
  - num=8
  - -depth
  - 6
---*)
---- MODULE simulate_temporal_violated_lasso ----
EXTENDS Naturals
VARIABLE x
Next == x' = (x + 1) % 3
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>[](x = 0)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate line 20, col 9 to line 20, col 13 of module simulate_temporal_violated_lasso>
    x = 0
    2217:4 2: <Next line 19, col 9 to line 19, col 24 of module simulate_temporal_violated_lasso>
    x = 1
    2217:4 3: <Next line 19, col 9 to line 19, col 24 of module simulate_temporal_violated_lasso>
    x = 2
    2122:4 1: Back to state: <Next line 19, col 9 to line 19, col 24 of module simulate_temporal_violated_lasso>
    2209:0 Progress(1) at <date>: 7 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 7
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 7 states generated, -1 distinct states found, -1 states left on queue.
---*)
