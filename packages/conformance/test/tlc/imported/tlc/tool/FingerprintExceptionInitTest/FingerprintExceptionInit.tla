(*---
description: Ported from TLC's FingerprintExceptionInitTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/FingerprintExceptionInitTest.java
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
------------------------ MODULE FingerprintExceptionInit --------------------

EXTENDS Integers

VARIABLE x

Init == x = SUBSET(SUBSET(1..36))
Next == IF {1} \in SUBSET(1..31) THEN x' = SUBSET(SUBSET(1..32)) ELSE x' = 2
Spec == Init /\ [][Next]_x

=============================================================================

(*--- recorded
all:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing the number of elements in:
    SUBSET (1..36)
    | While working on the initial state:
    | x = SUBSET SUBSET (1..36)
    2178:0 Overflow when computing the number of elements in:
    SUBSET (1..36)
    2178:0 Overflow when computing the number of elements in:
    SUBSET (1..36)
    2178:0 Overflow when computing the number of elements in:
    SUBSET (1..36)
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
