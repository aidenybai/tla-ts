(*---
description: "A parameterized instance can give each process its own view, like an index in a function of variables."
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [variables]
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
outcome: success
---*)
---- MODULE parameterized_process_index ----
EXTENDS Naturals
---- MODULE Cell ----
VARIABLE v
Flip == v' = 1 - v
Stay == v' = v
====
VARIABLE f
C(p) == INSTANCE Cell WITH v <- f[p]
Init == f = [p \in {1, 2} |-> 0]
Next == \E p \in {1, 2} : f' = [f EXCEPT ![p] = 1 - @] /\ C(p)!Flip
Inv == f \in [{1, 2} -> {0, 1}]
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-18
    2199:0 9 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 2 and the 95th percentile is 2).
---*)
