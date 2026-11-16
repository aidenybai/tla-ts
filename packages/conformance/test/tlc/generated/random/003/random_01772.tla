(*---
description: Evaluates a random bool expression, seed 262, number 1772.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01772 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE) = {Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)), (-(7 * 3))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
