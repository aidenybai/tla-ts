(*---
description: Evaluates a random bool expression, seed 262, number 7384.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07384 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq({(Tail(<<3, 1, 2>>)).a, (Head(<<>>) % LET b11371 == 0 IN b11371)}, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07384 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
