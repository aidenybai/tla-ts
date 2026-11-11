(*---
description: Evaluates a random bool expression, seed 262, number 9555.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09555 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len((Tail(FALSE) \o <<-1, 3>>)) \in (((1 - 2) - (2 * 2)) .. <<(7 % 2147483647), (1 \div 7)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09555 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
---*)
