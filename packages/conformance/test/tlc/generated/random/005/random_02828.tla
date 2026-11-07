(*---
description: Evaluates a random int expression, seed 262, number 2828.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02828 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((Cardinality(UNION {{2, 1, 3}, {}}) :> Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    (3 :> 1)
    2181:0 Attempted to compute cardinality of the value
    (3 :> 1)
---*)
