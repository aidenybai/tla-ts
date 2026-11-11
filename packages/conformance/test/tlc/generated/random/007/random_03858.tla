(*---
description: Evaluates a random int expression, seed 262, number 3858.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03858 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(((<<3, 7>> \o Append(<<1>>, 2147483647)) \o Tail(SortSeq(<<1>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 4"
---*)
