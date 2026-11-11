(*---
description: Evaluates a random set expression, seed 262, number 4975.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04975 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (((2147483647 :> -1) @@ [(1 :> 2) EXCEPT ![-1] = 0]) @@ (([a |-> 1]).a :> LET b7751 == 0 IN b7751)))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 49 to line 14, col 54 of module random_04975
    | {1, 2147483647}
---*)
