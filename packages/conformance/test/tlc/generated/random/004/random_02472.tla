(*---
description: Evaluates a random seq expression, seed 262, number 2472.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02472 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq([Append(<<1, 2>>, 2) EXCEPT ![1] = Cardinality({2, 1, 3})], LAMBDA p, q : p < q), Len(Append(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), ([x \in Nat |-> x + 1])[1]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 2, 3, 3>>"
---*)
