(*---
description: Evaluates a random seq expression, seed 262, number 5560.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05560 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(Append(Tail(<<1, 2>>), (-3)), (-(3 - 1))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-3, -2, 2>>"
---*)
