(*---
description: 'ALIAS rewrites states on the safety-like path of printErrorTrace too.'
ref: tlc2/tool/liveness/LiveCheck.java#printErrorTrace
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  ALIAS Al
---*)
---- MODULE alias_on_safety_like ----
EXTENDS Naturals
VARIABLE x
Next == x' = 1 - x
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Al == [double |-> 2 * x]
Prop == <>(x = 99)
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
    double = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module alias_on_safety_like>
    double = 2
    2122:4 1: Back to state: <Next line 14, col 9 to line 14, col 18 of module alias_on_safety_like>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
