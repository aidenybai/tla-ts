(*---
description: 'ALIAS rewrites each state of a simulated counterexample.'
ref: tlc2/tool/liveness/LiveCheck1.java#checkTrace
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
  ALIAS Al
args:
  - -simulate
  - num=8
  - -depth
  - 6
---*)
---- MODULE simulate_alias_on_counterexample ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Al == [double |-> 2 * x]
Prop == <>(x = 99)
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
    2217:4 1: <Initial predicate line 21, col 9 to line 21, col 13 of module simulate_alias_on_counterexample>
    double = 0
    2217:4 2: <Next line 20, col 9 to line 20, col 27 of module simulate_alias_on_counterexample>
    double = 2
    2217:4 3: <Next line 20, col 9 to line 20, col 27 of module simulate_alias_on_counterexample>
    double = 4
    2218:4 4: Stuttering
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
---*)
