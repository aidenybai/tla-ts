(*---
description: Evaluates a random int expression, seed 262, number 6812.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06812 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b10444 == Len(Tail(Tail(<<1, 2>>))) IN (((2 * b10444) % ([a |-> 1]).a) - ((-b10444) - (-1 % b10444))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06812 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
