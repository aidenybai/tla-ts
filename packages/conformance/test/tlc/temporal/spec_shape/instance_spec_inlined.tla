(*---
description: 'INSTANCE substitutions reach processConfigSpec as SubstInNode: the init and box are found under them.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: success
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE instance_spec_inlined ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

---- MODULE Inner ----
EXTENDS Naturals
VARIABLE y
InnerInit == y = 0
InnerNext == y < 2 /\ y' = y + 1
InnerSpec == InnerInit /\ [][InnerNext]_y
====
I == INSTANCE Inner WITH y <- x
Spec == I!InnerSpec
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
