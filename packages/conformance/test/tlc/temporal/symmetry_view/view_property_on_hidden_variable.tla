(*---
description: 'Liveness evaluates on the first representative state found per view fingerprint.'
ref: tlc2/tool/liveness/LiveWorker.java#printTrace
features: [liveness, view]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  VIEW Vw
  PROPERTY Prop
---*)
---- MODULE view_property_on_hidden_variable ----
EXTENDS Naturals
VARIABLES x, h
Next == x' = (x + 1) % 2 /\ h' = (h + 1) % 3
Spec == x = 0 /\ h = 0 /\ [][Next]_<<x, h>> /\ WF_<<x, h>>(Next)
Vw == x
Prop == []<>(h = 2)
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
    2217:4 2: <Next line 14, col 9 to line 14, col 44 of module view_property_on_hidden_variable>
    /\ h = 1
    /\ x = 1
    2122:4 1: Back to state: <Next line 14, col 9 to line 14, col 44 of module view_property_on_hidden_variable>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
