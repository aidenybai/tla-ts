(*---
description: Evaluates a random seq expression, seed 262, number 1827.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01827 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([SortSeq(Append(<<>>, 2147483647), LAMBDA p, q : p < q) EXCEPT ![1] = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
