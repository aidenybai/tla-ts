(*---
description: Evaluates a random seq expression, seed 262, number 3405.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03405 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((SortSeq((FALSE /\ TRUE), LAMBDA p, q : p < q) \o Len((<<3, 1, 2>> \o <<>>)))))
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
