(*---
description: "The eventually check only looks at operator applications, so a LET around an action escapes the 4311 rule."
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
config: |
  INIT Init
  NEXT Next
outcome: success
---*)
---- MODULE temporal_eventually_let_not_checked ----
VARIABLE v
A == <>(LET a == v' IN a)
Init == v = 0
Next == v' = v
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
