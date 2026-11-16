(*---
description: Evaluates a random int expression, seed 262, number 2719.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02719 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head((SortSeq(SubSeq(<<1, 2>>, 7, -1), LAMBDA p, q : p < q) \o Append(Tail(<<3, 1, 2>>), Head(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
