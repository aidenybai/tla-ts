(*---
description: Evaluates a random seq expression, seed 262, number 8.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00008 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(SubSeq(SortSeq(2..1, LAMBDA p, q : p < q), CASE FALSE -> 0 [] OTHER -> 2147483647, Head(<<>>)), ([a |-> 3, b |-> TRUE]).a), Head([[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = CASE FALSE -> 1 [] OTHER -> 0]), Head(Tail(Append(<<3, 1, 2>>, 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {}
---*)
