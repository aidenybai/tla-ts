(*---
description: Evaluates a random int expression, seed 262, number 8836.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08836 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({LET b13683 == Len(<<1>>) IN ([a |-> 1, b |-> TRUE]).a, (Head(<<1>>) + CASE TRUE -> 0 [] OTHER -> 0)}).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08836 failed.
    Attempted to select field "a" from a non-record value {1}
    line 14, col 16 to line 14, col 120 of module random_08836
---*)
