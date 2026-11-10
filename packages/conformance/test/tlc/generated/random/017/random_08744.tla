(*---
description: Evaluates a random int expression, seed 262, number 8744.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08744 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SortSeq((Append(<<3, 1, 2>>, 3) \o Append(<<3, 1, 2>>, -1)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
