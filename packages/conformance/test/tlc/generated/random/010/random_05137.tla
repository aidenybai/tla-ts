(*---
description: Evaluates a random int expression, seed 262, number 5137.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05137 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SubSeq(Append(<<>>, 0), CASE FALSE -> 2 [] OTHER -> {2, 1, 3}, (0 % 2147483647))) + (((2147483647 + 0) + ([a |-> 1, b |-> TRUE]).a) % Len(SubSeq(<<1, 2>>, 2, 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05137 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    {1, 2, 3}
---*)
