(*---
description: Evaluates a random seq expression, seed 262, number 4970.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04970 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail(<<CASE FALSE -> 3 [] OTHER -> 2, CASE FALSE -> 2147483647 [] OTHER -> 2>>), Len(Tail(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))), (Cardinality((3 .. 3)) :> (LET b7743 == 2147483647 IN b7743 % Head(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<0>>
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<0>>
---*)
