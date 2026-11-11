(*---
description: Evaluates a random bool expression, seed 262, number 7392.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07392 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq((SelectSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0) \o SelectSeq(Tail(<<3, 1, 2>>), LAMBDA e : e > 0)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1, 2, 2>>"
---*)
