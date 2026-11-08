(*---
description: Evaluates a random bool expression, seed 262, number 3013.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03013 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Append([<<>> EXCEPT ![1] = -1], Cardinality(Nat))) = Len(SubSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), ([x \in Nat |-> x + 1])[7], (3 \div 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 30 to line 14, col 33 of module random_03013
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03013 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
