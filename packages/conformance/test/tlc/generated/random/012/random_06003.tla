(*---
description: Evaluates a random seq expression, seed 262, number 6003.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06003 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append(Append(SortSeq(<<1>>, LAMBDA p, q : p < q), (3 - 0)), Len(SelectSeq(<<>>, LAMBDA e : e > 0))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 3>>"
---*)
