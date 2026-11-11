(*---
description: Evaluates a random function expression, seed 262, number 8166.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08166 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> (3 + 2), b |-> (FALSE \/ FALSE)] EXCEPT ![((1..3)[1] \div Cardinality(7))] = ([[a |-> 1] EXCEPT !.a = @ + 1]).a] @@ (([b12633 \in {1} |-> 1] @@ (CHOOSE f \in [1..2 -> {1, 2}] : TRUE)) @@ ((0 % -1) :> IF TRUE THEN 0 ELSE 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08166 failed.
    A non-function (a set of the form i..j) was applied as a function.
    line 14, col 68 to line 14, col 76 of module random_08166
---*)
