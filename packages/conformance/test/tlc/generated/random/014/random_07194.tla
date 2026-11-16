(*---
description: Evaluates a random int expression, seed 262, number 7194.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07194 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Len((SortSeq(<<1>>, LAMBDA p, q : p < q) \o SelectSeq(<<1>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2"
---*)
