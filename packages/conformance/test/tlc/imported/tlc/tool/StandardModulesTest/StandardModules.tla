(*---
description: Ported from TLC's StandardModulesTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/StandardModulesTest.java
features:
  - tlc-regression
outcome: success
config: |-
  INIT Init
  NEXT Next
args:
  - -deadlock
---*)
------------------------------- MODULE StandardModules -------------------------------
EXTENDS Bags, Sequences, FiniteSets, TLC, RealTime, Naturals, Integers, Randomization
VARIABLES x
Init == FALSE /\ x = 0
Next == [][FALSE /\ x' = x]_<<x>>
============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
