(*---
description: Evaluates a random seq expression, seed 262, number 9599.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09599 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail(SortSeq((CHOOSE r \in [a : 1..2] : TRUE), LAMBDA p, q : p < q)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> 1]
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> 1]
---*)
