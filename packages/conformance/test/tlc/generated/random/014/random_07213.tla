(*---
description: Evaluates a random function expression, seed 262, number 7213.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07213 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head(SortSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q)), Len(Append(Append(<<1, 2>>, -1), ({1} \subseteq <<3, 1, 2>>)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07213 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
