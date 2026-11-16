(*---
description: 'POSTCONDITION runs after the counterexample with it in TLCGet.'
ref: tlc2/tool/liveness/LiveWorker.java#printTrace
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  POSTCONDITION Post
---*)
---- MODULE postcondition_after_liveness_violation ----
EXTENDS Naturals, TLC
VARIABLE x
Next == x' = 1 - x
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Post == PrintT(TLCGet("generated"))
Prop == <>[](x = 0)
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
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module postcondition_after_liveness_violation>
    x = 1
    2122:4 1: Back to state: <Next line 14, col 9 to line 14, col 18 of module postcondition_after_liveness_violation>
    | 3
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
