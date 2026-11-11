(*---
description: Evaluates a random record expression, seed 262, number 7657.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07657 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))] EXCEPT !.a = @ + (LET b11784 == Len(<<1>>) IN IF TRUE THEN 2 ELSE 7 - Len(SortSeq(<<1>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07657 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 48 of module random_07657
---*)
