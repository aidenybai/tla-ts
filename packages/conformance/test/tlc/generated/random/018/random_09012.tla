(*---
description: Evaluates a random int expression, seed 262, number 9012.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09012 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> ({2, 1, 3}).a, b |-> (\E b14000 \in {1, 2} : TRUE)]).a * (Len(<<1, 2147483647>>) - (IF TRUE THEN FALSE ELSE 1 % (1 + 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09012 failed.
    Attempted to select field "a" from a non-record value {1, 2, 3}
    line 14, col 25 to line 14, col 37 of module random_09012
---*)
