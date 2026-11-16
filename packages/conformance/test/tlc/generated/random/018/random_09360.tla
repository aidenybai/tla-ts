(*---
description: Evaluates a random set expression, seed 262, number 9360.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09360 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))), (([b14531 \in Nat |-> b14531])[(0 + 7)] * ((2147483647).a + (7 % 7)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09360 failed.
    Attempted to select field "a" from a non-record value 2147483647
    line 14, col 108 to line 14, col 121 of module random_09360
---*)
