(*---
description: 'Attribution evaluates angle-action formulas pair by pair, the last state pairing to the cycle start.'
ref: tlc2/tool/liveness/LNAction.java#evalOnLasso
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY P2 P1
---*)
---- MODULE attribution_with_action_in_lasso ----
EXTENDS Naturals
VARIABLE x
Next == x' = (x + 1) % 2
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
P1 == []<><<x' = 0>>_x
P2 == <>(x = 99)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 2 branches of temporal properties for the complete state space with 4 total distinct states at (<date>)
    2116:1 Temporal property P2 was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 13, col 9 to line 13, col 24 of module attribution_with_action_in_lasso>
    x = 1
    2122:4 1: Back to state: <Next line 13, col 9 to line 13, col 24 of module attribution_with_action_in_lasso>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
