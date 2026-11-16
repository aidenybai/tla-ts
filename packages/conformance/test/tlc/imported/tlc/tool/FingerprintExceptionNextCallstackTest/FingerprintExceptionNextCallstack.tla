(*---
description: Ported from TLC's FingerprintExceptionNextCallstackTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/FingerprintExceptionNextCallstackTest.java
features:
  - tlc-regression
outcome: evaluation-failure
config: |-
  INIT
  Init

  NEXT
  Next
args:
  - -deadlock
---*)
--------------------- MODULE FingerprintExceptionNextCallstack ------------------ 

EXTENDS Integers

VARIABLE x

Op(S) == LET iter[s \in SUBSET S] == s IN iter[S]
Init == x = 0
Next == x' = Op(42)
Spec == Init /\ [][Next]_x

=============================================================================

   \* Simulates e.g. user passing 42 instead of DOMAIN <<1,2>>.
   MapThenFoldSet(+, 0, LAMBDA i: <<1,2>>[i], LAMBDA S: Min(S), 42)

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check if the non-enumerable value
    42
    is element of
    SUBSET 42
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 24, column 9 to line 24, column 19 in FingerprintExceptionNextCallstack
    1. Line 24, column 14 to line 24, column 19 in FingerprintExceptionNextCallstack
    2. Line 22, column 10 to line 22, column 49 in FingerprintExceptionNextCallstack
    3. Line 22, column 43 to line 22, column 49 in FingerprintExceptionNextCallstack
    4. Line 22, column 25 to line 22, column 32 in FingerprintExceptionNextCallstack


    Reason:
    Attempted to check if the non-enumerable value
    42
    is element of
    SUBSET 42
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
