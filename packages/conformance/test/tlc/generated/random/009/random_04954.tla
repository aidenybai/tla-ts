(*---
description: Evaluates a random seq expression, seed 262, number 4954.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04954 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<Len((CHOOSE f \in [{} -> {2, 1, 3}] : TRUE)), Len(<<2, 2>>)>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 2>>"
---*)
