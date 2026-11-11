(*---
description: Evaluates a random bool expression, seed 262, number 3600.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03600 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Tail(SortSeq(<<2147483647, 2>>, LAMBDA p, q : p < q)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2147483647>>"
---*)
