(*---
description: Ported from TLC's Github971dTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github971dTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY LeadsTo
  PROPERTY Tautology
args:
  - -lncheck
  - final
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
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 2 branches of temporal properties for the complete state space with 4 total distinct states at (<date>)
    2116:1 Temporal property LeadsTo was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <NextAB line 28, col 5 to line 28, col 16 of module Github971>
    x = 1
    2217:4 3: <NextAB line 28, col 5 to line 28, col 16 of module Github971>
    x = 0
    2217:4 4: <NextAB line 28, col 5 to line 28, col 16 of module Github971>
    x = 1
    2217:4 5: <NextAB line 28, col 5 to line 28, col 16 of module Github971>
    x = 0
    2122:4 2: Back to state: <NextAB line 28, col 5 to line 28, col 16 of module Github971>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 5 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
