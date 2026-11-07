(*---
description: Evaluates a random seq expression, seed 262, number 9482.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09482 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((SelectSeq(<<2147483647, -1>>, LAMBDA e : e > 0) \o Append(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), Len(<<1>>))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2147483647, 1, 2, 3, 1>>"
---*)
