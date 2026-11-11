(*---
description: Evaluates a random seq expression, seed 262, number 9156.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09156 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((SortSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q) \o (Tail(<<3, 1, 2>>) \o [a |-> 2147483647, b |-> FALSE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09156 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    [a |-> 2147483647, b |-> FALSE]
---*)
