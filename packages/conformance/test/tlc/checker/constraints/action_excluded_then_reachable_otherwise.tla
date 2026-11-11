(*---
description: A state excluded on one step is enqueued when another step reaches it, because excluded states aren't fingerprinted.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: success
config: |
  INIT Init
  NEXT Next
  ACTION_CONSTRAINT Con
---*)
---- MODULE action_excluded_then_reachable_otherwise ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == \/ x = 0 /\ x' = 2
        \/ x = 0 /\ x' = 1
        \/ x = 1 /\ x' = 2
        \/ x = 2 /\ x' = 2
Con == ~(x = 0 /\ x' = 2)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 3.3E-19
    2199:0 5 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
