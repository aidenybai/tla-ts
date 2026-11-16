(*---
description: 'A parameterized instance spec, with the formal bound by getOpContext, is decomposed like a plain spec.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: success
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE parameterized_instance_spec ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

---- MODULE Ring ----
EXTENDS Naturals
CONSTANT Limit
VARIABLE y
RingInit == y = 0
RingNext == y' = (y + 1) % Limit
RingSpec == RingInit /\ [][RingNext]_y
====
R(c) == INSTANCE Ring WITH Limit <- c, y <- x
Spec == R(3)!RingSpec
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-19
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
