(*---
description: Ported from TLC's EmptySubsetEqTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/EmptySubsetEqTest.java
features:
  - tlc-regression
outcome: evaluation-failure
config: |-
  SPECIFICATION
  Spec
  INVARIANT
  Inv
args:
  - -deadlock
---*)
--------------------------- MODULE EmptySubsetEq --------------------------
EXTENDS Integers, FiniteSets

VARIABLE b

Init == b = TRUE

Next == b' = /\ (SUBSET (1..3)) \subseteq (1..4)

Spec == Init /\ [][Next]_<<b>>

Inv == b = TRUE
=============================================================================

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check if the value:
    {}
    is in the integer interval 1..4
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    b = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 22, column 9 to line 22, column 48 in EmptySubsetEq
    1. Line 22, column 14 to line 22, column 48 in EmptySubsetEq
    2. Line 22, column 17 to line 22, column 48 in EmptySubsetEq
    3. Line 22, column 18 to line 22, column 30 in EmptySubsetEq


    Reason:
    Attempted to check if the value:
    {}
    is in the integer interval 1..4
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
