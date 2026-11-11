(*---
description: 'With no initial state, a temporal property has nothing to reject: success with zero states.'
ref: tlc2/tool/ModelChecker.java#doInit
features: [liveness]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE no_initial_states_no_error ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x \in {} /\ [][Next]_x /\ WF_x(Next)
Prop == []<>(x = 99)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 0 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
