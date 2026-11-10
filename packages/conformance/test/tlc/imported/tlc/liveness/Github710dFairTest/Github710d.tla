(*---
description: Ported from TLC's Github710dFairTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/Github710dFairTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  SPECIFICATION FairSpec
  PROPERTY NeverThree
  PROPERTY neg_NeverThree
  PROPERTY EventuallyThree
  PROPERTY Tautology
args:
  - -deadlock
---*)
---- MODULE Github710d ----
EXTENDS Naturals
VARIABLE x

Init == x = 0

Step == x < 3 /\ x' = x + 1 \* x <= 3 - see git commit msg.

Spec == Init /\ [][Step]_x

FairSpec == Spec /\ WF_x(Step)

NeverThree == [](x = 1 => [](x # 3))

neg_NeverThree == ~(NeverThree)

EventuallyThree == <>(x = 3)

Tautology == (x = x) ~> (x = x)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 4 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 4 branches of temporal properties for the complete state space with 16 total distinct states at (<date>)
    2116:1 Temporal property NeverThree was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Step line 22, col 9 to line 22, col 27 of module Github710d>
    x = 1
    2217:4 3: <Step line 22, col 9 to line 22, col 27 of module Github710d>
    x = 2
    2217:4 4: <Step line 22, col 9 to line 22, col 27 of module Github710d>
    x = 3
    2218:4 5: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 4 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
