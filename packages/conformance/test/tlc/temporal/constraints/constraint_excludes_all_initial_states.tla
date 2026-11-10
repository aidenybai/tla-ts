(*---
description: 'A constraint false on the initial state means no state is queued; invariants still run but the graph is empty, and <>P has nothing to reject.'
ref: tlc2/tool/ModelChecker.java#doInit
features: [liveness, constraint]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CONSTRAINT No
---*)
---- MODULE constraint_excludes_all_initial_states ----
EXTENDS Naturals
VARIABLE x
Next == x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Con == x <= 2
No == x > 5
Prop == <>(x = 99)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2191:0 Finished computing initial states: 1 state generated, with 0 of them distinct at <date>.
    2192:0 Checking temporal properties for the complete state space with 0 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
