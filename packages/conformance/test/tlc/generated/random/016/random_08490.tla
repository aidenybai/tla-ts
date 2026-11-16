(*---
description: Evaluates a random int expression, seed 262, number 8490.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08490 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b13145 \in ((3 * 3) .. Head(<<3, 1, 2>>)) |-> ((-1 + 2147483647) % CASE FALSE -> 2 [] OTHER -> -1)])[Len(SortSeq(SubSeq(<<>>, 7, 3), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08490 failed.
    In applying the function
    <<>>,
    the first argument is:
    0
    which is not in its domain.
---*)
