(*---
description: Evaluates a random bool expression, seed 262, number 6595.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06595 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b10119 == (0 - 3) IN Head(<<3, 1, 2>>) - (([a |-> 1]).a % (0 * 1))) < (([a |-> 2147483647, b |-> FALSE]).a + Len(Tail(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06595 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
