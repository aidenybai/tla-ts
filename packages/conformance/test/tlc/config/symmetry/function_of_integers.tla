(*---
description: "A function over integers passes the check for function records, since nothing checks that it permutes model values, and the warning about small sets names it."
ref: tlc2/tool/impl/Tool.java#getSymmetryPerms
outcome: success
config: |
  INIT Init
  NEXT Next
  CONSTANT S = {a, b}
  SYMMETRY Sym
---*)
---- MODULE function_of_integers ----
EXTENDS TLC, Naturals
CONSTANT S
VARIABLE x
Init == x \in S
Next == x' = x
Sym == {[e \in {1, 2} |-> e]}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2300:3 The set [e\in{1,2}|->e] has been defined to be a symmetry set but contains less than two elements.
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.2E-19
    2199:0 4 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
