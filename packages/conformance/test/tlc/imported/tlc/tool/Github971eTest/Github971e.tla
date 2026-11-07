(*---
description: Ported from TLC's Github971eTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github971eTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY LeadsTo
  PROPERTY Tautology
args:
  - -deadlock
---*)
---- MODULE Github971e ----
EXTENDS Integers

VARIABLE x, y
vars == <<x, y>>

Init ==
    x = 0 /\ y = "a"

Next ==
    x' \in {0,1} /\ y' \in {"a", "b"}

Spec ==
    Init /\ [][Next]_x /\ WF_x(Next)

LeadsTo ==
    \* lasso shaped counterexample/liveness property
    x = 0 ~> [](x = 1 => [](y = "a")) 

Tautology == (vars = vars) ~> (vars = vars)
==========================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2140:3 The subscript of the next-state relation specified by the specification
    does not seem to contain the state variable y
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 2 branches of temporal properties for the complete state space with 8 total distinct states at (<date>)
    2116:1 Temporal property LeadsTo was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = "a"
    2217:4 2: <Next line 24, col 5 to line 24, col 37 of module Github971e>
    /\ x = 1
    /\ y = "a"
    2217:4 3: <Next line 24, col 5 to line 24, col 37 of module Github971e>
    /\ x = 0
    /\ y = "a"
    2217:4 4: <Next line 24, col 5 to line 24, col 37 of module Github971e>
    /\ x = 1
    /\ y = "b"
    2217:4 5: <Next line 24, col 5 to line 24, col 37 of module Github971e>
    /\ x = 1
    /\ y = "a"
    2217:4 6: <Next line 24, col 5 to line 24, col 37 of module Github971e>
    /\ x = 0
    /\ y = "a"
    2122:4 2: Back to state: <Next line 24, col 5 to line 24, col 37 of module Github971e>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 17 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
