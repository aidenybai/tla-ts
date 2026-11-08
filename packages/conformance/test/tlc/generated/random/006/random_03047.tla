(*---
description: Evaluates a random seq expression, seed 262, number 3047.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03047 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(((3 % 7) - Len(2147483647)) - ((2147483647 = -1))[(-1 \div 2147483647)]), ((Len(<<3, 1, 2>>) % ([a |-> 1, b |-> TRUE]).a) - ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03047 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    2147483647
---*)
