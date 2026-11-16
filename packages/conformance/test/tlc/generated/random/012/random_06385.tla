(*---
description: Evaluates a random seq expression, seed 262, number 6385.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06385 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(<<IF TRUE THEN 2 ELSE 3, (0 * 1)>>, LAMBDA p, q : p < q), Len(Tail(SubSeq(<<3, 1, 2>>, 7, 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06385 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
