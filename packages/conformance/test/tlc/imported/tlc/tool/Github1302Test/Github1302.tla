(*---
description: Ported from TLC's Github1302Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github1302Test.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - Github1302.tla
  - -simulate
  - num=3
  - -depth
  - "3"
  - -deadlock
---*)
---- MODULE Github1302 ----
r == [ i \in {1} |-> "A"]

\* Changing this to {r} prevents the bug:
\* {r} is a SetEnumValue but not FcnLambdaValue.
S == [ {1} -> {"A"} ]

ASSUME S = {r}

VARIABLES v

TypeOK == v \in [S -> {1}]

Init == v = [s \in S |-> 1]

\* This is equivalent to UNCHANGED v.
Next == v' = [v EXCEPT ![ r ] = @]

Spec == Init /\ [][Next]_v /\ WF_v(Next)

\* The actual property doesn't matter here as long
\* as it triggers the simulator's liveness checker.
Prop == TRUE ~> TRUE

=====
----- CONFIG Github1302 ----
SPECIFICATION Spec

PROPERTY Prop

\* Checking the invariant causes TLC to correctly
\* report stuttering.
\* Hypothesis: Invariant checking causes FcnLambdaValue
\* to be converted before liveness checking.
\*INVARIANT TypeOK
========

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(3) at <date>: 10 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(3) at <date>: 10 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 10
    Simulation using seed 4 and aril 0
---*)
