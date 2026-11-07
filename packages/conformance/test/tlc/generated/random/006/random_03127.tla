(*---
description: Evaluates a random seq expression, seed 262, number 3127.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03127 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SelectSeq(SortSeq((0 \in {1, 2}), LAMBDA p, q : p < q), LAMBDA e : e > 0), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    FALSE
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    FALSE
---*)
