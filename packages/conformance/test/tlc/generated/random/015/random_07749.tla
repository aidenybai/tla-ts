(*---
description: Evaluates a random int expression, seed 262, number 7749.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07749 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Append([Append(<<3, 1, 2>>, 3) EXCEPT ![1] = Cardinality({x \in 1..3 : x > 1})], Cardinality(({2, 1, 3} \cap {})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 5"
---*)
