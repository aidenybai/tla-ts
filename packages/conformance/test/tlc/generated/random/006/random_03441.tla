(*---
description: Evaluates a random seq expression, seed 262, number 3441.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03441 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq((Append(<<1, 2>>, 1) \o Append(<<1, 2>>, 2)), LAMBDA p, q : p < q) \o SelectSeq(Tail(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1, 1, 2, 2, 2, 2, 3>>"
---*)
