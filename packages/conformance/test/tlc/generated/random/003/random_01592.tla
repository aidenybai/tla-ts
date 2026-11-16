(*---
description: Evaluates a random int expression, seed 262, number 1592.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01592 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), Cardinality(1..3))) * Len(Append(Append(<<3, 1, 2>>, 2), Len(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 5"
---*)
