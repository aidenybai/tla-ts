(*---
description: Evaluates a random seq expression, seed 262, number 4776.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04776 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq((((0 .. 3) \cap DOMAIN [x \in Nat |-> x + 1]) \cap DOMAIN (CHOOSE f \in [{0} \cup {1} -> {2, 1, 3}] : TRUE)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {0, 1}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {0, 1}
---*)
