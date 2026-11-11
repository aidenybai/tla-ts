(*---
description: Evaluates a random int expression, seed 262, number 9234.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09234 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head((SelectSeq(Append(<<1, 2>>, 2147483647), LAMBDA e : e > 0) \o [SubSeq(<<1>>, 2, 0) EXCEPT ![1] = Cardinality({2, 1, 3})])))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 84 to line 14, col 102 of module random_09234
    | 1
---*)
