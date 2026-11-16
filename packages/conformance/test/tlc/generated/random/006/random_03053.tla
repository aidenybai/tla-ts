(*---
description: Evaluates a random int expression, seed 262, number 3053.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03053 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SortSeq((SelectSeq(<<1>>, LAMBDA e : e > 0) \o SortSeq(<<1>>, LAMBDA p, q : p < q)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
