(*---
description: Ported from TLC's Github1389ViolatedBTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github1389ViolatedBTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
  PROPERTY PropViolated
args:
  - -deadlock
---*)
--------------------------- MODULE Github1389ViolatedB ---------------------------
EXTENDS Naturals

VARIABLE x

RECURSIVE Reach(_)
Reach(n) == IF n = 0 THEN (x = 99) ELSE <>(Reach(n - 1))

Init == x = 0
Next == x' = 1 - x
Spec == Init /\ [][Next]_x /\ WF_x(Next)

PropViolated == Reach(3)
==================================================================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 2 total distinct states at (<date>)
    2116:1 Temporal property PropViolated was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 23, col 9 to line 23, col 18 of module Github1389ViolatedB>
    x = 1
    2122:4 1: Back to state: <Next line 23, col 9 to line 23, col 18 of module Github1389ViolatedB>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
