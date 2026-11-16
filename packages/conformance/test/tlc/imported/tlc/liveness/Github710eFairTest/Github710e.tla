(*---
description: Ported from TLC's Github710eFairTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/Github710eFairTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  SPECIFICATION FairSpec
  PROPERTY VisitsTwoThenStaysSmall
  PROPERTY neg_VisitsTwoThenStaysSmall
  PROPERTY EventuallyTwo
  PROPERTY Tautology
args:
  - -deadlock
---*)
---- MODULE Github710e ----
EXTENDS Naturals
VARIABLE x

Init == x = 0

Inc == x < 2 /\ x' = x + 1 \* x <= 2 - see git commit msg.
Next == Inc

Spec == Init /\ [][Next]_x

FairSpec == Spec /\ WF_x(Next)

VisitsTwoThenStaysSmall == <>(x = 1 /\ <>(x = 2)) => <>[](x < 2)

neg_VisitsTwoThenStaysSmall == ~(VisitsTwoThenStaysSmall)

EventuallyZero == <>(x = 0)
EventuallyTwo == <>(x = 2)

Tautology == (x = x) ~> (x = x)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 5 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 5 branches of temporal properties for the complete state space with 15 total distinct states at (<date>)
    2116:1 Temporal property VisitsTwoThenStaysSmall was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Inc line 22, col 8 to line 22, col 26 of module Github710e>
    x = 1
    2217:4 3: <Inc line 22, col 8 to line 22, col 26 of module Github710e>
    x = 2
    2218:4 4: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
