(*---
description: Evaluates a random seq expression, seed 262, number 6590.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06590 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((Append(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), (-1 * 3)) \o SelectSeq(Append(<<1>>, 7), LAMBDA e : e > 0)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 3, 1, 7>>"
---*)
