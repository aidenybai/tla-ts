(*---
description: Evaluates a random seq expression, seed 262, number 2230.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02230 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(Append(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), (0 \div 2)), LAMBDA p, q : p < q), (-LET b3505 == (CHOOSE b3506 \in SUBSET {1} : FALSE) IN (2 * b3505)), Len((SelectSeq(<<1, 2>>, LAMBDA e : e > 0) \o SubSeq(<<1>>, 7, 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02230 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 129 to line 14, col 163 of module random_02230
---*)
