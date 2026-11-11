(*---
description: Ported from TLC's Github971cTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github971cTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |
  INIT InitB
  NEXT NextC
  PROPERTY AtMostOnceC
  PROPERTY Tautology
args:
  - -lncheck
  - off
  - -deadlock
---*)
---- MODULE Github971 ----
EXTENDS Integers

VARIABLE x

InitA ==
    x = 0

InitB ==
    x = -1

NextAB ==
    x' \in {0,1} 

NextC ==
    NextAB \/ x' = 2

AtMostOnce ==
    []((x=1) => []((x=0) => [](x=0)))

AtMostOnceC ==
    []((x=1) => []((x=0) => [](x=2)))

Spec ==
    InitA /\ [][NextAB]_x /\ WF_x(NextAB)

LeadsTo ==
    \* lasso shaped counterexample/liveness property
    x = 0 ~> [](x = 1 => [](x = 1)) 

Tautology == (x = x) ~> (x = x)
==========================

fp(x =-1) =  3234510876920644087
fp(x = 0) = -3406341414084290173
fp(x = 1) =  -686636423115914061
fp(x = 2) = -7115858903467826205

(*--- recorded
all:
  exit: 12
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2116:1 Temporal property AtMostOnceC was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = -1
    2217:4 2: <NextAB line 29, col 5 to line 29, col 16 of module Github971>
    x = 1
    2217:4 3: <NextAB line 29, col 5 to line 29, col 16 of module Github971>
    x = 0
    2199:0 10 states generated, 4 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
