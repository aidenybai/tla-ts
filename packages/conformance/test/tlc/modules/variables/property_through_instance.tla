(*---
description: A temporal property may come from an instanced module.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [variables]
config: |
  SPECIFICATION Spec
  PROPERTY Prop
outcome: success
---*)
---- MODULE property_through_instance ----
EXTENDS Naturals
---- MODULE Counter ----
EXTENDS Naturals
VARIABLE v
Init0 == v = 0
Step == v' = (v + 1) % 3
Pos == v >= 0
Double == 2 * v
Live == []<>(v = 0)
====
VARIABLE x
M == INSTANCE Counter WITH v <- x
Spec == x = 0 /\ [][(x' = (x + 1) % 3)]_x /\ WF_x(x' = (x + 1) % 3)
Prop == M!Live
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 3 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-19
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
