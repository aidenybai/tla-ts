(*---
description: Evaluates a random seq expression, seed 262, number 3009.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03009 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([SortSeq(<<2, 2147483647>>, LAMBDA p, q : p < q) EXCEPT ![1] = Head(Append(3, 2))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03009 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    3
---*)
