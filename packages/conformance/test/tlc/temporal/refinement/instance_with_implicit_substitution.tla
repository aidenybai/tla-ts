(*---
description: 'INSTANCE with no WITH needs same-named outer variable: v is taken from the outer module.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness, refinement]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE instance_with_implicit_substitution ----
EXTENDS Naturals
VARIABLE v

---- MODULE Abs ----
EXTENDS Naturals
VARIABLE v
AInit == v = 0
ANext == v < 2 /\ v' = v + 1
ASpec == AInit /\ [][ANext]_v
ALive == ASpec /\ WF_v(ANext)
====
N == v < 2 /\ v' = v + 1
Spec == v = 0 /\ [][N]_v /\ WF_v(N)
AA == INSTANCE Abs
Prop == AA!ASpec
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 17, col 10 to line 17, col 10 of module instance_with_implicit_substitution
    | Multiple declarations or definitions for symbol v.  
    | This duplicates the one at line 13, col 10 to line 13, col 10 of module instance_with_implicit_substitution.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
