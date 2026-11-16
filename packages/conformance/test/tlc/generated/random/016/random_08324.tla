(*---
description: Evaluates a random seq expression, seed 262, number 8324.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08324 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq([[<<1>> EXCEPT ![1] = 3] EXCEPT ![1] = (1 % 2)], LAMBDA p, q : p < q) EXCEPT ![1] = SelectSeq(Tail(SubSeq(<<3, 1, 2>>, 3, 2147483647)), LAMBDA e : e > 0)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08324 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    2147483647
---*)
