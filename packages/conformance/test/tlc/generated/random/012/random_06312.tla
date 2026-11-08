(*---
description: Evaluates a random seq expression, seed 262, number 6312.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06312 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), (7 + 1)), Len(SubSeq(<<1, 2>>, 3, FALSE)), Len([<<>> EXCEPT ![1] = 3])) EXCEPT ![1] = (((CHOOSE f \in [2..1 -> {1}] : TRUE))[(3 % 3)] - (-(1 - 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06312 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    FALSE
---*)
