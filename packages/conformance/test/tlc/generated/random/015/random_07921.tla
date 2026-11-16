(*---
description: Evaluates a random set expression, seed 262, number 7921.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07921 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Tail(SubSeq(Tail(<<>>), (-2147483647), (2147483647 * 2))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07921 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
