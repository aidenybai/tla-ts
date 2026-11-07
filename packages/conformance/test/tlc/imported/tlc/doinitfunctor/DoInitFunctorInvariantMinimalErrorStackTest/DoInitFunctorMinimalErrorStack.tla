(*---
description: Ported from TLC's DoInitFunctorInvariantMinimalErrorStackTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/doinitfunctor/DoInitFunctorInvariantMinimalErrorStackTest.java
features:
  - tlc-regression
outcome: evaluation-failure
config: |
  SPECIFICATION
  Spec
  INVARIANT
  Inv
args:
  - -deadlock
---*)
------------------ MODULE DoInitFunctorMinimalErrorStack --------------------
EXTENDS Naturals

VARIABLES a, b
vars == <<a, b>>

Init == 
  /\ a \in [1..2 -> 1..3]
  /\ b = TRUE

Spec == Init /\ [][UNCHANGED vars]_vars

(* This property is violated by all of the init states *)
Inv == a >= 0
=============================================================================

(*--- recorded
all:
  exit: 75
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    <<1, 1>>
    2266:0 The first argument of > should be an integer, but instead it is:
    <<1, 1>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 22, column 3 to line 23, column 13 in DoInitFunctorMinimalErrorStack
    1. Line 22, column 6 to line 22, column 25 in DoInitFunctorMinimalErrorStack
    2. Line 23, column 6 to line 23, column 13 in DoInitFunctorMinimalErrorStack
    3. Line 28, column 8 to line 28, column 13 in DoInitFunctorMinimalErrorStack
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
