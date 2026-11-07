(*---
description: Ported from TLC's DoInitFunctorEvalExceptionTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/doinitfunctor/DoInitFunctorEvalExceptionTest.java
features:
  - tlc-regression
outcome: evaluation-failure
config: |
  CONSTRAINT
  const_4711
  SPECIFICATION
  Spec
  INVARIANT
  NotNine
args:
  - -deadlock
---*)
--------------------------- MODULE DoInitFunctorEvalException ---------------------------
EXTENDS Integers

VARIABLES x
vars == <<x>>

Init == x \in 1..10

Next == x' = 0

Spec == Init /\ [][Next]_vars

(* This function is used as a model constraint to trigger an EvalException (because it doesn't return Bool) *)
F(a) == {}
const_4711 == F(x)

(* This property is violated by one of the init states *)
NotNine == x # 9 
=============================================================================

(*--- recorded
all:
  exit: 75
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 31, col 15 to line 31, col 18 of module DoInitFunctorEvalException
    | While working on the initial state:
    | x = 1
    2215:0 TLC expected a boolean value, but did not find one. line 31, col 15 to line 31, col 18 of module DoInitFunctorEvalException
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 23, column 9 to line 23, column 19 in DoInitFunctorEvalException
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
