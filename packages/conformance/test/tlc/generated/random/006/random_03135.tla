(*---
description: Evaluates a random int expression, seed 262, number 3135.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03135 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SelectSeq([SortSeq(<<1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = Cardinality(Nat)], LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03135 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
