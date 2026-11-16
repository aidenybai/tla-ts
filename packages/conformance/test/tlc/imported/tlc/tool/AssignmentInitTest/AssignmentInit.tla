(*---
description: Ported from TLC's AssignmentInitTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/AssignmentInitTest.java
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
--------------------------- MODULE AssignmentInit ---------------------------
EXTENDS Integers, TLC
VARIABLE s

min(S) == CHOOSE e \in S: \A a \in S: e <= a

InitExit(var, S) == \E val \in S: (var = val /\ var > min(S))

InitAll(var, S) == \A val \in S: (var = val /\ var \in S)

InitIn(var, S) == var \in S /\ var > min(S)

InitEq(var, S, val) == var \in S /\ var + 1 = val

isOdd(n) == n % 2 = 1
InitEven(var, S) == var \in S /\ isOdd(var)

\* With this Init(var), the test does not fail without its fix.
\*Init(ignored) == \E val \in {0,1}: (s = val /\ s > 0)

\* Init1 one state + Init3 one state
Spec == /\ \/ InitExit(s, {0,1}) \* 1 unique state
           \/ InitAll(s, {2})    \* 1 unique state
           \/ InitIn(s, {4,5})   \* 1 unique state
           \/ InitAll(s, {6,7})  \* 0 unique states
           \/ InitEq(s, {8,9}, 10) \* 1 unique states
           \/ InitEven(s, {10,11}) \* 1 unique states
        /\ [][InitExit(s, {0,1})/\UNCHANGED s]_s

=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2190:0 Finished computing initial states: 5 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.7E-19
    2199:0 6 states generated, 5 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
