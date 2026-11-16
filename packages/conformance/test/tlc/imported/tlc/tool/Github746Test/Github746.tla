(*---
description: Ported from TLC's Github746Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github746Test.java
features:
  - tlc-regression
outcome: safety-violation
config: |-
  SPECIFICATION Spec
  INVARIANTS Inv
  ALIAS Alias
args:
  - -deadlock
---*)
---------------------------- MODULE Github746 ----------------------------

VARIABLE i

Init == i = 1

Next == UNCHANGED i

Spec == Init /\ [][Next]_i

Inv == i = 2

Alias == [
i |-> i, foo |-> "bar", j |-> i = i'
]

==========================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    /\ i = 1
    /\ foo = "bar"
    /\ j = TRUE
---*)
