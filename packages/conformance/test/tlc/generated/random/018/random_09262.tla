(*---
description: Evaluates a random seq expression, seed 262, number 9262.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09262 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SortSeq(Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), (3 * 1)), LAMBDA p, q : p < q), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 3>>"
---*)
