(*---
description: Evaluates a random seq expression, seed 262, number 2953.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02953 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<Head(Tail(<<>>)), ((3 % 0) % (-3))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02953 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
