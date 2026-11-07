(*---
description: Ported from TLC's FingerprintExceptionNextTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/FingerprintExceptionNextTest.java
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
------------------------ MODULE FingerprintExceptionNext --------------------

EXTENDS Integers

VARIABLE x

Init == x = 0
Next == IF {1} \in SUBSET(1..31) THEN x' = SUBSET(SUBSET(1..32)) ELSE x' = 2
Spec == Init /\ [][Next]_x

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
    : @!@!@STARTMSG 2178:0 @!@!@
    Overflow when computing the number of elements in:
    SUBSET (1..32)
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2178:0 @!@!@
    Overflow when computing the number of elements in:
    SUBSET (1..32)
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2178:0 @!@!@
    Overflow when computing the number of elements in:
    SUBSET (1..32)
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2178:0 @!@!@
    Overflow when computing the number of elements in:
    SUBSET (1..32)
    2178:0 Overflow when computing the number of elements in:
    SUBSET (1..32)
    2178:0 Overflow when computing the number of elements in:
    SUBSET (1..32)
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
