(*---
description: Evaluates a random int expression, seed 262, number 710.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00710 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SubSeq(SubSeq(Tail(<<3, 1, 2>>), (0 * 7), (2147483647 + -1)), Len(SortSeq(<<1>>, LAMBDA p, q : p < q)), (Head(<<1>>) - (-1 % 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00710 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
---*)
