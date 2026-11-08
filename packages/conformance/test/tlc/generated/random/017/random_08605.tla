(*---
description: Evaluates a random seq expression, seed 262, number 8605.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08605 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<((CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE))[Cardinality(Nat)], Len(<<2, 2147483647>>)>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08605 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
