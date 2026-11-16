(*---
description: Evaluates a random seq expression, seed 262, number 7466.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07466 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((SubSeq(<<7, 7>>, (2 % 1), (CHOOSE b11506 \in {} : TRUE)) \o [SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)]), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07466 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 54 to line 14, col 80 of module random_07466
---*)
