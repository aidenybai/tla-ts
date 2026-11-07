(*---
description: Evaluates a random int expression, seed 262, number 8273.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08273 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-Head(Tail(<<3, 1, 2>>))) \div (([[a |-> 1] EXCEPT !.a = 7] * Len({2, 1, 3})) - ((2147483647 \div 0) + CASE FALSE -> -1 [] OTHER -> -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    {1, 2, 3}
    2283:0 The argument of Len should be a sequence, but instead it is:
    {1, 2, 3}
---*)
