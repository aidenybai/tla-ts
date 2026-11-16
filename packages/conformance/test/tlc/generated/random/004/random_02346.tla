(*---
description: Evaluates a random seq expression, seed 262, number 2346.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02346 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq(SortSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
