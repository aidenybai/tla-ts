(*---
description: Evaluates a random seq expression, seed 262, number 5368.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05368 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SelectSeq(SelectSeq(Append(<<3, 1, 2>>, 2147483647), LAMBDA e : e > 0), LAMBDA e : e > 0), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 3, 2147483647>>"
---*)
