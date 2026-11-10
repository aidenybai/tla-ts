(*---
description: 'BUG: a constant base case of a temporal RECURSIVE operator is rebuilt by astToLive(expr, con, 0), whose getLevelBound on the call returns the temporal level, so it falls to new LNAction(Reach(0)) and classifyExpr rejects a formula with no action in it.'
ref: tlc2/tool/liveness/Liveness.java#astToLive
features: [liveness, tlc-bug]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
correct:
  all:
    exit: 0
    transcript: |-
      2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2192:0 Checking 2 branches of temporal properties for the complete state space with 6 total distinct states at (<date>)
      2267:0 Finished checking temporal properties in <time> at <date>
      2193:0 Model checking completed. No error has been found.
        Estimates of the probability that TLC did not check all reachable states
        because two distinct states had the same fingerprint:
        calculated (optimistic):  val = 0.0
      2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 3.
      2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
---- MODULE recursive_temporal_with_conj ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
RECURSIVE Reach(_)
Reach(n) == IF n = 0 THEN TRUE ELSE <>(x = n) /\ Reach(n - 1)
Prop == Reach(2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
