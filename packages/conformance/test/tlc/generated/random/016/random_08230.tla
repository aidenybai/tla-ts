(*---
description: Evaluates a random seq expression, seed 262, number 8230.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08230 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(([(7 :> -1) EXCEPT ![(7 + -1)] = (CHOOSE b12738 \in {1, 2} : FALSE)] @@ (([a |-> 1, b |-> TRUE]).a :> LET b12739 == 2147483647 IN 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 24 to line 14, col 30 of module random_08230
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08230 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    (1 :> 3 @@ 7 :> -1)
---*)
