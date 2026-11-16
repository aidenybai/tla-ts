(*---
description: Evaluates a random seq expression, seed 262, number 1304.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01304 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o <<2, 7>>), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 2, 7>>"
---*)
