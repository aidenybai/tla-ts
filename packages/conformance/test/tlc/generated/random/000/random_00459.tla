(*---
description: Evaluates a random function expression, seed 262, number 459.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00459 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(SortSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q), LAMBDA p, q : p < q) EXCEPT ![1] = {(-(2147483647 \div 1)), Len(SubSeq(<<>>, 2147483647, 1))}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{-2147483647, 0}, 2, 3>>"
---*)
