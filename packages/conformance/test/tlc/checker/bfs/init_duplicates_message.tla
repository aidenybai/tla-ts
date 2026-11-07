(*---
description: Duplicate initial states use the message with distinct and generated counts.
ref: tlc2/tool/ModelChecker.java#modelCheckImpl
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE init_duplicates_message ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 1 \/ x = 1 \/ x = 2
Next == x' = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2191:0 Finished computing initial states: 3 states generated, with 2 of them distinct at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 3.3E-19
    2199:0 5 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
