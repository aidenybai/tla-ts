(*---
description: 'An action argument passed through a parameter under []<> is accepted as an EA action, and the counterexample fails it.'
ref: tlc2/tool/liveness/Liveness.java#classifyExpr
features: [liveness, levels]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE tlc_operator_param_infinitely_often_action ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
F(a) == []<>a
Prop == F(x' = x + 1)
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
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module tlc_operator_param_infinitely_often_action>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 27 of module tlc_operator_param_infinitely_often_action>
    x = 2
    2218:4 4: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
