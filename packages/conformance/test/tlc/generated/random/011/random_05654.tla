(*---
description: Evaluates a random seq expression, seed 262, number 5654.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05654 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq(((1 - 1) .. (-1)), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]).a, LET b8731 == Len(<<1, 2>>) IN (2147483647 + b8731)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2
    2178:0 Overflow when computing 2147483647+2
---*)
