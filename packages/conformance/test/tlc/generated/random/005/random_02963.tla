(*---
description: Evaluates a random seq expression, seed 262, number 2963.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02963 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((SortSeq(SubSeq(<<1, 2>>, 7, 3), LAMBDA p, q : p < q) \o SelectSeq(<<2, 0>>, LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
