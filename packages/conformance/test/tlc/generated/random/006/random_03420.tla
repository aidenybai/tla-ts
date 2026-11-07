(*---
description: Evaluates a random seq expression, seed 262, number 3420.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03420 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(<<IF TRUE THEN -1 ELSE 2147483647, Len(<<>>)>>, (Head(<<1>>) + Len(<<3, 1, 2>>)), Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))) \o Tail(SortSeq(<<-1, [x \in Nat |-> x + 1]>>, LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    [x \in Nat |-> <expression line 14, col 192 to line 14, col 196 of module random_03420>]
    2266:0 The first argument of < should be an integer, but instead it is:
    [x \in Nat |-> <expression line 14, col 192 to line 14, col 196 of module random_03420>]
---*)
