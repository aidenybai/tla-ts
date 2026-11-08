(*---
description: Evaluates a random seq expression, seed 262, number 2134.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02134 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((SortSeq(Tail(<<>>), LAMBDA p, q : p < q) \o (SelectSeq(<<>>, LAMBDA e : e > 0) \o Tail(<<1>>))), (Len((3 \o <<3, 1, 2>>)) + ((1..3 = {}) + Tail(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02134 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
