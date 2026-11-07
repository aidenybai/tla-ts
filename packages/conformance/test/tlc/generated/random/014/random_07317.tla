(*---
description: Evaluates a random seq expression, seed 262, number 7317.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07317 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = ([a |-> -1, b |-> FALSE]).a], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> -1]
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> -1]
---*)
