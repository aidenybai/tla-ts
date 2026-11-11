(*---
description: Evaluates a random seq expression, seed 262, number 6101.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06101 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([SortSeq(Append(<<1>>, 3), LAMBDA p, q : p < q) EXCEPT ![1] = Cardinality({b9388 \in {1} : FALSE})], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 3>>"
---*)
