(*---
description: Evaluates a random seq expression, seed 262, number 3944.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03944 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((Tail(Tail(<<1, 2>>)) \o (SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) \o SortSeq(<<1, 2>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3, 1, 2>>"
---*)
