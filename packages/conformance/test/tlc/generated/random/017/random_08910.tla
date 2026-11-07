(*---
description: Evaluates a random int expression, seed 262, number 8910.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08910 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b13804 == Head(SelectSeq(SortSeq([a |-> 1, b |-> TRUE], LAMBDA p, q : p < q), LAMBDA e : e > 0)) IN (LET b13805 == (7 + 1) IN (CHOOSE b13806 \in 1..3 : TRUE) - ((CHOOSE b13807 \in TRUE : TRUE) + CASE TRUE -> {1} [] OTHER -> 7)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08910 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 182 to line 14, col 210 of module random_08910
---*)
