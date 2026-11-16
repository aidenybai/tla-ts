(*---
description: Evaluates a random seq expression, seed 262, number 4867.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04867 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((Append(SubSeq(<<3, 1, 2>>, 2, {1}), (CHOOSE b7581 \in {} : <<5, 6>>)) \o SelectSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04867 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    {1}
---*)
