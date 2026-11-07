(*---
description: Evaluates a random seq expression, seed 262, number 8600.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08600 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq(<<Head(<<1>>), (3 + 2147483647)>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 3+2147483647
    2178:0 Overflow when computing 3+2147483647
---*)
