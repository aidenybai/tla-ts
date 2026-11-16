(*---
description: Ported from TLC's PrintTraceRaceTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/PrintTraceRaceTest.java
features:
  - tlc-regression
outcome: evaluation-failure
config: |-
  \* INIT definition
  INIT
  init_143958263805435000
  \* NEXT definition
  NEXT
  next_143958263806436000
  \* INVARIANT definition
  INVARIANT
  inv_143958263807437000
  \* Generated on Fri Aug 14 13:03:58 PDT 2015
args:
  - -deadlock
includes:
  - PrintTraceRace.tla
---*)
---- MODULE MC ----
EXTENDS PrintTraceRace, TLC

\* INIT definition @modelBehaviorInit:0
init_143958263805435000 ==
TestInit
----
\* NEXT definition @modelBehaviorNext:0
next_143958263806436000 ==
TestNext
----
\* INVARIANT definition @modelCorrectnessInvariants:0
inv_143958263807437000 ==
TestTypeInv
----
=============================================================================

(*--- recorded
all:
  exit: 76
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2111:1 Evaluating invariant inv_143958263807437000 failed.
    Attempted to check equality of the set {1, 2} with the value:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    S = [q |-> <<>>, i |-> 1]
    2217:4 2: <Send line 11, col 9 to line 12, col 66 of module PrintTraceRace>
    S = [q |-> <<1>>, i |-> 2]
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).
---*)
