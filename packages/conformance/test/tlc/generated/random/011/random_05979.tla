(*---
description: Evaluates a random function expression, seed 262, number 5979.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05979 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-LET b9214 == (1 + 1) IN (<<5, 6>>)[b9214]) :> Len(SortSeq(SubSeq(<<1, 2>>, 1, 7), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    7
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    7
---*)
