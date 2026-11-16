(*---
description: Evaluates a random seq expression, seed 262, number 1460.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01460 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(Tail([<<>> EXCEPT ![1] = TRUE]), ((3 + 1) * (1 - 0))) \o Append(Tail(SubSeq(<<1, 2>>, 1, 7)), (-(-2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 30 to line 14, col 33 of module random_01460
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01460 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
