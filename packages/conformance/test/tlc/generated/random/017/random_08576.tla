(*---
description: Evaluates a random set expression, seed 262, number 8576.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08576 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((CHOOSE r \in [a : {}] : TRUE)).a, ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a} \ DOMAIN ((0 + 2147483647) :> (3 % 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08576 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 47 of module random_08576
---*)
