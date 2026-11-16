(*---
description: Evaluates a random seq expression, seed 262, number 2053.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02053 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(SelectSeq(<<2147483647, 3>>, LAMBDA e : e > 0)) \o SelectSeq((<<7, 3>> \o SortSeq(<<1, 2>>, LAMBDA p, q : p < q)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 7, 3, 1, 2>>"
---*)
