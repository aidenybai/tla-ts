(*---
description: Evaluates a random seq expression, seed 262, number 6027.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06027 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq(Tail([<<>> EXCEPT ![1] = -1]), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 37 to line 14, col 40 of module random_06027
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06027 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
