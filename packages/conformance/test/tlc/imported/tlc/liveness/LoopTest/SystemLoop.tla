(*---
description: Ported from TLC's LoopTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/LoopTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  SPECIFICATION
  Spec
  PROPERTY
  Liveness
  PROPERTY neg_Liveness
  PROPERTY XInitZero
  PROPERTY Tautology
args:
  - -deadlock
---*)
----------------------------- MODULE SystemLoop -----------------------------

(* System LOOP as described by Manna & Pneuli on page 423ff *)

VARIABLES x
vars == <<x>>

Init == x = 0

One == x = 0 /\ x' = 1
Two == x = 1 /\ x' = 2
Three == x = 2 /\ x' = 3
Back == x = 3 /\ x' = 0

Next == One \/ Two \/ Three \/ Back

Spec == Init /\ [][Next]_vars

SpecWeakFair == Spec /\ WF_vars(Next)

Liveness == []<>(x=3)

neg_Liveness == ~(Liveness)

XInitZero == <>(x = 0)

Tautology == (vars = vars) ~> (vars = vars)
=============================================================================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 3 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 3 branches of temporal properties for the complete state space with 12 total distinct states at (<date>)
    2116:1 Temporal property Liveness was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <One line 27, col 8 to line 27, col 22 of module SystemLoop>
    x = 1
    2217:4 3: <Two line 28, col 8 to line 28, col 22 of module SystemLoop>
    x = 2
    2218:4 4: Stuttering
    2259:3 The stuttering counterexample above may be caused by the absence of a fairness constraint in the behavior specification Spec defined at line 34, col 1 to line 34, col 29 of module SystemLoop. To rule out such counterexamples, conjoin a suitable fairness constraint to Spec (compare Chapter 8, page 87ff of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 5 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
