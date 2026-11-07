(*---
description: Evaluates a random bool expression, seed 262, number 5838.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05838 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(Append(SubSeq(<<3, 1, 2>>, 3, 2147483647), (CHOOSE b9001 \in 1..3 : TRUE)), LAMBDA e : e > 0) = Len(SortSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    2147483647
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    2147483647
---*)
