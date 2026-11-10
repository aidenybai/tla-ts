(*---
description: Evaluates a random seq expression, seed 262, number 1208.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01208 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq(SortSeq(Append(<<3, 1, 2>>, 0), LAMBDA p, q : p < q), LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 1, 2, 3>>"
---*)
