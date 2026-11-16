(*---
description: Evaluates a random set expression, seed 262, number 7859.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07859 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (((1..3 \cap {1}) \cap UNION {{x \in 1..3 : x > 1}, {1, 2}}) @@ ([[x \in 1..2 |-> x] EXCEPT ![3] = 0] @@ (CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 89 to line 14, col 106 of module random_07859
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07859 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    {1}
---*)
