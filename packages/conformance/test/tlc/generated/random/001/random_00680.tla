(*---
description: Evaluates a random function expression, seed 262, number 680.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00680 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((Cardinality(2..1) \div (7 % 2147483647)) :> Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))) EXCEPT ![(Cardinality(({1, 2} \cap {})) \div ((3 + 1) - (2 * 7)))] = Len(Append(Append(<<3, 1, 2>>, -1), (0 - 2)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 5)"
---*)
