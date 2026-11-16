(*---
description: In a lasso, -difftrace still names the state the trace goes back to.
ref: tlc2/output/StatePrinter.java#printBackToState
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
args:
  - -difftrace
---*)
---- MODULE lasso_back_to_state ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x' = (x + 1) % 2 /\ UNCHANGED y
Spec == Init /\ [][Next]_<<x, y>> /\ WF_<<x, y>>(Next)
Prop == <>(x = 9)
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
    /\ x = 0
    /\ y = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 39 of module lasso_back_to_state>
    /\ x = 1
    2122:4 1: Back to state: <Next line 15, col 9 to line 15, col 39 of module lasso_back_to_state>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
