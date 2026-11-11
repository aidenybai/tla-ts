(*---
description: 'Only the initial states inside the constraint start behaviors.'
ref: tlc2/tool/ModelChecker.java#doInit
features: [liveness, constraint]
outcome: success
config: |
  SPECIFICATION Spec2
  PROPERTY Prop
  CONSTRAINT Con
---*)
---- MODULE constraint_excludes_some_initial_states ----
EXTENDS Naturals
VARIABLE x
Next == x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Con == x <= 2
Spec2 == x \in {0, 7} /\ [][Next]_x /\ WF_x(Next)
Prop == <>(x = 1)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2191:0 Finished computing initial states: 2 states generated, with 1 of them distinct at <date>.
    2192:0 Checking temporal properties for the complete state space with 3 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 3.3E-19
    2199:0 5 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
