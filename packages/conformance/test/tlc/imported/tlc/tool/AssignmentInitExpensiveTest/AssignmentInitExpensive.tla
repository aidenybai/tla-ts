(*---
description: Ported from TLC's AssignmentInitExpensiveTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/AssignmentInitExpensiveTest.java
features:
  - tlc-regression
outcome: success
config: |-
  SPECIFICATION
  Spec
  CONSTANT
  N = 42
  M = 42
  \*INVARIANT
  \*Inv
args:
  - -deadlock
---*)
--------------------------- MODULE AssignmentInitExpensive ---------------------------
EXTENDS Integers
VARIABLE s

\* expensiveOp takes ~10 seconds wallclock time on a modern day machine.
\* The point is, that doing 10k times will make the test time out.
expensiveOp == CHOOSE e \in SUBSET (1..18) : TRUE

\* This variant (with an unused parameter) causes TLC to reevaluate 
\* CHOOSE ... SUBSET 10k times.
\*expensiveOpParam(ignored) == CHOOSE e \in SUBSET (1..18) : TRUE

Init(var) == \E val \in 0..10000: var = expensiveOp

Spec == Init(s) /\ [][UNCHANGED s]_s

=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2269:0 Computed 16 initial states...
    2269:0 Computed 32 initial states...
    2269:0 Computed 64 initial states...
    2269:0 Computed 128 initial states...
    2269:0 Computed 256 initial states...
    2269:0 Computed 512 initial states...
    2269:0 Computed 1024 initial states...
    2269:0 Computed 2048 initial states...
    2269:0 Computed 4096 initial states...
    2269:0 Computed 8192 initial states...
    2191:0 Finished computing initial states: 10001 states generated, with 1 of them distinct at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-16
    2199:0 10002 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
