(*---
description: "In the next-state relation s1 is not null, so LazyValue caches a LET definition and its second use does not run it again."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
outcome: success
config: |
  SPECIFICATION Spec
args: [-deadlock]
---*)
---- MODULE definition_cached_within_action ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
VARIABLE x
Init == x = 0
Next == /\ x = 0
        /\ LET a == P(1, x) IN a + a = 0
        /\ x' = 1
Spec == Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 1
    | 1
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
