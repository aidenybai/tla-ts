(*---
description: Evaluates a random record expression, seed 262, number 5777.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05777 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (([x \in 1..2 |-> x])[2147483647] % (-1 * 2147483647)), b |-> ((1..3 % -1) = (-1 + 3))] EXCEPT !.a = Len(([<<1, 2>> EXCEPT ![1] = 7] \o [<<1, 2>> EXCEPT ![1] = 7]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05777 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
