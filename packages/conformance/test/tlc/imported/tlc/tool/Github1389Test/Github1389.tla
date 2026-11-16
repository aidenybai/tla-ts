(*---
description: Ported from TLC's Github1389Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github1389Test.java
features:
  - tlc-regression
outcome: success
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
  PROPERTIES
      PropIf
      PropDepth
      PropElseRec
args:
  - -deadlock
---*)
--------------------------- MODULE Github1389 ---------------------------
\* Regression test for https://github.com/tlaplus/tlaplus/issues/1389
\* Recursive operators whose body reaches temporal level were previously
\* rejected by TLC with "TLC cannot handle the temporal formula".  When
\* the recursion terminates during tableau construction via an IF guard
\* that evaluates to a constant, the liveness translator now expands the
\* operator and translates only the chosen IF branch.  Other branch-
\* selection constructs (CASE, conjunction, disjunction, implication) are
\* not handled; users should write recursive operators with IF/THEN/ELSE
\* (the most natural form for recursion in TLA+).

EXTENDS Naturals

VARIABLE x

\* Recursive operator with a temporal body and an IF guard that
\* terminates the recursion during tableau construction.  The original
\* issue used [][TRUE]_x; we use a state-level <>P here because it is a
\* regular temporal formula that TLC's tableau actually inspects (the
\* [][TRUE]_x case is recognized as an action property at the
\* SpecProcessor level and never reaches the liveness translator).
RECURSIVE ap_0(_)
ap_0(u) == IF u THEN <>(x = TRUE) ELSE ap_0(~u)

\* Recursion that terminates via a constant numeric guard.  Exercises
\* expansion that walks the parameter from 3 down to 0 without ever
\* encountering a state-dependent guard.
RECURSIVE ap_2(_)
ap_2(n) == IF n = 0 THEN <>(x = TRUE) ELSE ap_2(n - 1)

\* Mirror of ap_2 with the recursive call in THEN and the terminating
\* branch in ELSE.  Exercises the symmetric branch of the OPCODE_ite
\* handling (guard TRUE -> recurse on THEN, guard FALSE -> take ELSE).
RECURSIVE ap_3(_)
ap_3(n) == IF n > 0 THEN ap_3(n - 1) ELSE <>(x = TRUE)

Spec == x = TRUE /\ [][x' = ~x]_x

PropIf      == ap_0(TRUE)
PropDepth   == ap_2(3)
PropElseRec == ap_3(3)
=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 3 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 3 branches of temporal properties for the complete state space with 6 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
