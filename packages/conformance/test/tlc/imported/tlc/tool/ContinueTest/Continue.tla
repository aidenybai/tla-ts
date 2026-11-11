(*---
description: Ported from TLC's ContinueTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/ContinueTest.java
features:
  - tlc-regression
  - tlc-bug
outcome: success
config: |-
  INIT Init
  NEXT Next

  CONSTRAINT Constraint

  INVARIANT Inv1
  INVARIANT Inv2
args:
  - -continue
  - -deadlock
correct:
  all:
    exit: 12
    transcript: |-
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2110:1 Invariant Inv1 is violated.
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      /\ x = 1
      /\ y = 1
      2217:4 2: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 2
      /\ y = 2
      2110:1 Invariant Inv2 is violated.
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      /\ x = 1
      /\ y = 1
      2217:4 2: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 2
      /\ y = 1
      2217:4 3: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 3
      /\ y = 1
      2217:4 4: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 4
      /\ y = 1
      2217:4 5: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 5
      /\ y = 1
      2217:4 6: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 6
      /\ y = 1
      2217:4 7: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 7
      /\ y = 1
      2217:4 8: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 8
      /\ y = 1
      2217:4 9: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 9
      /\ y = 1
      2217:4 10: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 10
      /\ y = 1
      2217:4 11: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 11
      /\ y = 1
      2217:4 12: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 12
      /\ y = 1
      2217:4 13: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 13
      /\ y = 1
      2217:4 14: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 14
      /\ y = 1
      2217:4 15: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 15
      /\ y = 1
      2217:4 16: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 16
      /\ y = 1
      2217:4 17: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 17
      /\ y = 1
      2217:4 18: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 18
      /\ y = 1
      2217:4 19: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 19
      /\ y = 1
      2217:4 20: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 20
      /\ y = 1
      2217:4 21: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 21
      /\ y = 1
      2217:4 22: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 22
      /\ y = 1
      2217:4 23: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 23
      /\ y = 1
      2217:4 24: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 24
      /\ y = 1
      2217:4 25: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 25
      /\ y = 1
      2217:4 26: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 26
      /\ y = 1
      2217:4 27: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 27
      /\ y = 1
      2217:4 28: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 28
      /\ y = 1
      2217:4 29: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 29
      /\ y = 1
      2217:4 30: <Next line 134, col 9 to line 137, col 28 of module Continue>
      /\ x = 30
      /\ y = 1
      2199:0 32 states generated, 29 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 29.
---*)
---- MODULE Continue ----
EXTENDS Naturals

VARIABLES x,y

Init == x = 1 /\ y = 1

Next == /\ x' = x + 1 
        /\ \/ /\ x = 1
              /\ y' \in {1,2}
           \/ /\ UNCHANGED y

\* For the test to meaningful, it is vital that workers
\* actually continue state space exploration after the
\* first invariant violation (for trace files to be written).
Inv1 == y < 2
Inv2 == x < 30

Constraint == Inv1 /\ Inv2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv1 is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 1
    /\ y = 1
    2217:4 2: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 2
    /\ y = 2
    2110:1 Invariant Inv2 is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 1
    /\ y = 1
    2217:4 2: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 2
    /\ y = 1
    2217:4 3: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 3
    /\ y = 1
    2217:4 4: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 4
    /\ y = 1
    2217:4 5: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 5
    /\ y = 1
    2217:4 6: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 6
    /\ y = 1
    2217:4 7: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 7
    /\ y = 1
    2217:4 8: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 8
    /\ y = 1
    2217:4 9: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 9
    /\ y = 1
    2217:4 10: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 10
    /\ y = 1
    2217:4 11: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 11
    /\ y = 1
    2217:4 12: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 12
    /\ y = 1
    2217:4 13: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 13
    /\ y = 1
    2217:4 14: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 14
    /\ y = 1
    2217:4 15: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 15
    /\ y = 1
    2217:4 16: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 16
    /\ y = 1
    2217:4 17: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 17
    /\ y = 1
    2217:4 18: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 18
    /\ y = 1
    2217:4 19: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 19
    /\ y = 1
    2217:4 20: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 20
    /\ y = 1
    2217:4 21: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 21
    /\ y = 1
    2217:4 22: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 22
    /\ y = 1
    2217:4 23: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 23
    /\ y = 1
    2217:4 24: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 24
    /\ y = 1
    2217:4 25: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 25
    /\ y = 1
    2217:4 26: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 26
    /\ y = 1
    2217:4 27: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 27
    /\ y = 1
    2217:4 28: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 28
    /\ y = 1
    2217:4 29: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 29
    /\ y = 1
    2217:4 30: <Next line 134, col 9 to line 137, col 28 of module Continue>
    /\ x = 30
    /\ y = 1
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 4.7E-18
    2199:0 32 states generated, 29 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 29.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
