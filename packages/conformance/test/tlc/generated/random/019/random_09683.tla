(*---
description: Evaluates a random seq expression, seed 262, number 9683.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09683 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq([SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = (CHOOSE b15021 \in 1..3 : FALSE)], ((-1 \div 2) \div Head(<<3, 1, 2>>)), (SubSeq(<<1, 2>>, <<3, 1, 2>>, 2))[(-1 \div 3)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09683 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 86 to line 14, col 115 of module random_09683
---*)
