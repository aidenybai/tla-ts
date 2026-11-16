(*---
description: Evaluates a random seq expression, seed 262, number 7532.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07532 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SortSeq(SubSeq(Tail(<<1, 2>>), LET b11610 == 2147483647 IN 2, (2 \div 1)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07532 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<2>>
    , but instead it is
    2
---*)
