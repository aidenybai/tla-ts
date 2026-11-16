(*---
description: Evaluates a random int expression, seed 262, number 2314.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02314 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SortSeq(((<<1>> \o <<3, 1, 2>>) \o Append(<<1, 2>>, 2)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 7"
---*)
