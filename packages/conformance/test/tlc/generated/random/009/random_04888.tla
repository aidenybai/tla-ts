(*---
description: Evaluates a random set expression, seed 262, number 4888.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04888 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] EXCEPT !.a = (-3)] EXCEPT !.a = @ + SelectSeq(({1} \cap 1..3), LAMBDA e : e > 0)] \cap (((2147483647 + 3) % (-1 - 3)) .. (Len(<<>>) \div IF FALSE THEN 0 ELSE 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04888 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {1}
---*)
