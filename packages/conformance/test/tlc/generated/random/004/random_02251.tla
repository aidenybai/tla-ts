(*---
description: Evaluates a random bool expression, seed 262, number 2251.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02251 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq(SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), (CHOOSE b3546 \in {x \in 1..3 : x > 1} : FALSE), Cardinality({1, 2})), Cardinality([[x \in 1..2 |-> x] EXCEPT ![2147483647] = 2]), (SelectSeq(<<>>, LAMBDA e : e > 0) \o (<<3, 1, 2>> \o <<3, 1, 2>>))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02251 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 75 to line 14, col 119 of module random_02251
---*)
