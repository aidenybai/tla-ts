(*---
description: Evaluates a random int expression, seed 262, number 9017.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09017 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality(SUBSET {1}) * (7 + 0)) * (LET b14008 == 1 IN 7 - (1 % 2147483647))) - Len(SortSeq(Append(<<1, 2>>, [x \in 1..2 |-> x]), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    <<1, 2>>
    2266:0 The first argument of < should be an integer, but instead it is:
    <<1, 2>>
---*)
