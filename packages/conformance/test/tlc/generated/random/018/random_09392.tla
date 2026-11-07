(*---
description: Evaluates a random set expression, seed 262, number 9392.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09392 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((7 + 0) * (0 + 2147483647)) - Len(SortSeq(<<>>, LAMBDA p, q : p < q))), Len((SortSeq(<<1>>, LAMBDA p, q : p < q) \o SelectSeq(<<>>, LAMBDA e : e > 0)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 7*2147483647
    2178:0 Overflow when computing 7*2147483647
---*)
