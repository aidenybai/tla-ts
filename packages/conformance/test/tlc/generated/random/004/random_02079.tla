(*---
description: Evaluates a random int expression, seed 262, number 2079.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02079 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-LET b3308 == Head(Tail(<<>>)) IN ((2..1 % b3308) - (0 + b3308))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02079 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
