(*---
description: Evaluates a random function expression, seed 262, number 3373.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03373 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = 2147483647]).a * (Cardinality({2, 1, 3}))[(1 % -1)]) :> (CHOOSE r \in [a : {1, 2}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03373 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 60 to line 14, col 93 of module random_03373
---*)
