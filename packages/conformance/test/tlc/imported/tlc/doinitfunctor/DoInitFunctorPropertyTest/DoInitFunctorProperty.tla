(*---
description: Ported from TLC's DoInitFunctorPropertyTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/doinitfunctor/DoInitFunctorPropertyTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  SPECIFICATION
  Spec
  PROPERTY
  NotNine
args:
  - -deadlock
---*)
--------------------------- MODULE DoInitFunctorProperty ---------------------------
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
  exit: 13
  transcript: |-
    2255:3 The formula NotNine is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula NotNine holds in all states of every behavior, use INVARIANT NotNine instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula NotNine changes it into a temporal formula, asserting that NotNine holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2108:1 Property NotNine is violated by the initial state:
    x = 9
---*)
