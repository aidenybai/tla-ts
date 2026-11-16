(*---
description: Ported from TLC's NormalizationTLCSetTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/NormalizationTLCSetTest.java
features:
  - tlc-regression
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -deadlock
---*)
------------------------- MODULE NormalizationTLCSet -------------------------
\* TLC normalizes a set enumeration only when it has to (see
\* NormalizationAssume.tla). TLC evaluates Init outside of a worker, so TLCSet
\* writes the function to the registers of all workers. Writing it doesn't have
\* to normalize the set in its range, so TLC checks the spec even though it
\* cannot compare the elements 1 and "a".
EXTENDS TLC
VARIABLE x
Init == x = FALSE /\ TLCSet(1, [y \in {1} |-> {1, "a"}])
Next == x' = ~x
=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
