(*---
description: A temporal property from an instance reports a counterexample on the outer variable.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [variables]
config: |
  SPECIFICATION Spec
  PROPERTY Prop
outcome: liveness-violation
---*)
---- MODULE property_through_instance_violated ----
EXTENDS Naturals
---- MODULE Counter ----
EXTENDS Naturals
VARIABLE v
Init0 == v = 0
Step == v' = (v + 1) % 3
Pos == v >= 0
Double == 2 * v
Live == <>(v = 1)
====
VARIABLE x
M == INSTANCE Counter WITH v <- x
Spec == x = 0 /\ [][(x' = (x + 1) % 3)]_x
Prop == M!Live
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 3 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2218:4 2: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
