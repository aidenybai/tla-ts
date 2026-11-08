(*---
description: Evaluates a random bool expression, seed 262, number 3097.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03097 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~({CASE TRUE -> 0 [] OTHER -> 2, Len(FALSE)} = (Len(<<3, 1, 2>>) .. (3 - 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03097 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    FALSE
---*)
