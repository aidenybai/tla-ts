(*---
description: Ported from TLC's DoInitFunctorInvariantNoContinueTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/doinitfunctor/DoInitFunctorInvariantNoContinueTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |
  SPECIFICATION
  Spec
  INVARIANT
  Inv
args:
  - -deadlock
---*)
--------------------------- MODULE DoInitFunctorInvariantContinue ---------------------------
EXTENDS Integers

VARIABLES x
vars == <<x>>

Init == x \in 1..10

Next == x' = 0

Spec == Init /\ [][Next]_vars

(* This property is violated by all of the init states *)
Inv == x \notin Nat 
=============================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = 1
---*)
