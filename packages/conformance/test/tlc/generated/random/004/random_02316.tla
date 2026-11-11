(*---
description: Evaluates a random bool expression, seed 262, number 2316.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02316 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (1..3)[{}], b |-> (TRUE \/ FALSE)] EXCEPT !.a = @ + LET b3661 == (-0) IN IF TRUE THEN 0 ELSE b3661] EXCEPT !.a = @ + IF (\A b3662 \in UNION {1..3, 1..3} : UNION {Nat, 1..3}) THEN Head(SortSeq(<<>>, LAMBDA p, q : p < q)) ELSE SelectSeq(Len(<<3, 1, 2>>), LAMBDA e : e > 0)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02316 failed.
    A non-function (a set of the form i..j) was applied as a function.
    line 14, col 25 to line 14, col 34 of module random_02316
---*)
