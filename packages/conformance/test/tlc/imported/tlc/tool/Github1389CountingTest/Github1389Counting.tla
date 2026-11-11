(*---
description: Ported from TLC's Github1389CountingTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github1389CountingTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
  PROPERTIES
      CountAtMostFour
  POSTCONDITION PostCondition
args:
  - -deadlock
---*)
--------------------------- MODULE Github1389Counting ---------------------------
\* Regression test for https://github.com/tlaplus/tlaplus/issues/1389
\* exercising the "counting safety property" use case -- the primary
\* motivation for permitting RECURSIVE operators at temporal level.
\*
\* Bound the number of times an event may occur.  The canonical example
\* here is "x is TRUE in at most n disjoint intervals", equivalently 
\* "x becomes TRUE at most n times":
\*
\*   AtMost(0) == []~x                              \* never TRUE
\*   AtMost(1) == [](x => [](~x => []~x))           \* TRUE in at most 1 interval
\*   AtMost(2) == [](x => [](~x => [](x => [](~x => []~x))))
\*   ...

EXTENDS Naturals, FiniteSets, TLCExt

VARIABLE x

RECURSIVE AtMost(_)
AtMost(n) == IF n = 0 THEN []~x
                      ELSE [](x => [](~x => AtMost(n - 1)))

Init == x = FALSE
Next == x' \in BOOLEAN
Spec == Init /\ [][Next]_x

CountAtMostFour == AtMost(4)

------------------------------------------------------------------

PostCondition ==
    LET S == CounterExample.state
        A == CounterExample.action
    IN
    /\ Cardinality(S) = 10
    /\ Cardinality(A) = 9
    /\ \A i \in 1..10 :
         \E s \in S :
            /\ s[1] = i
            /\ s[2].x = (i % 2 = 0)
    /\ \A a \in A : a[2].name = "Next"
==================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2116:1 Temporal property CountAtMostFour was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = FALSE
    2217:4 2: <Next line 39, col 9 to line 39, col 22 of module Github1389Counting>
    x = TRUE
    2217:4 3: <Next line 39, col 9 to line 39, col 22 of module Github1389Counting>
    x = FALSE
    2217:4 4: <Next line 39, col 9 to line 39, col 22 of module Github1389Counting>
    x = TRUE
    2217:4 5: <Next line 39, col 9 to line 39, col 22 of module Github1389Counting>
    x = FALSE
    2217:4 6: <Next line 39, col 9 to line 39, col 22 of module Github1389Counting>
    x = TRUE
    2217:4 7: <Next line 39, col 9 to line 39, col 22 of module Github1389Counting>
    x = FALSE
    2217:4 8: <Next line 39, col 9 to line 39, col 22 of module Github1389Counting>
    x = TRUE
    2217:4 9: <Next line 39, col 9 to line 39, col 22 of module Github1389Counting>
    x = FALSE
    2217:4 10: <Next line 39, col 9 to line 39, col 22 of module Github1389Counting>
    x = TRUE
    2199:0 5 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
