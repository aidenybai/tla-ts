(*---
description: Evaluates a random seq expression, seed 262, number 5630.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05630 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(SubSeq((<<1>> \o <<3, 1, 2>>), (CHOOSE b8701 \in SUBSET {1} : FALSE), CASE TRUE -> 0 [] OTHER -> 2), LAMBDA p, q : p < q) EXCEPT ![1] = Head(SortSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05630 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 57 to line 14, col 91 of module random_05630
---*)
