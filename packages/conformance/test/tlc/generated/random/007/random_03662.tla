(*---
description: Evaluates a random int expression, seed 262, number 3662.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03662 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF <<Cardinality(({2, 1, 3} \ {1})), (IF TRUE THEN 2147483647 ELSE 7 + (2 - 1))>> THEN (((3 :> 0))[(0 - 1)] - (Append(<<>>, 2147483647) - (2 * 1))) ELSE Len(SortSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03662 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 16 to line 14, col 237 of module random_03662
---*)
