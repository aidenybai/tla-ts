(*---
description: INIT and NEXT resolve through the overrides, so the model uses the replacements.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInitAndNext
outcome: success
config: |
  INIT Init
  NEXT Next
  CONSTANT Init <- MCInit
  Next <- MCNext
---*)
---- MODULE init_and_next_overridden ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
MCInit == x = 1
MCNext == x' = x
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
