(*---
description: Evaluates a random seq expression, seed 262, number 4278.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04278 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Tail([Tail(<<1, 2>>) EXCEPT ![1] = (-1 + 2)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04278 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
