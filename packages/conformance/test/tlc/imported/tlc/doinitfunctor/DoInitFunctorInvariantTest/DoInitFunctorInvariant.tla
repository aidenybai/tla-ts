(*---
description: Ported from TLC's DoInitFunctorInvariantTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/doinitfunctor/DoInitFunctorInvariantTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |
  SPECIFICATION
  Spec
  INVARIANT
  NotNine
args:
  - -deadlock
---*)
--------------------------- MODULE DoInitFunctorInvariant ---------------------------
EXTENDS Integers

VARIABLES x
vars == <<x>>

Init == x \in 1..10

Next == x' = 0

Spec == Init /\ [][Next]_vars

(* This property is violated by one of the init states *)
NotNine == x # 9 
=============================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2107:1 Invariant NotNine is violated by the initial state:
    x = 9
---*)
