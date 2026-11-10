(*---
description: Evaluates a random int expression, seed 262, number 3754.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03754 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(((Head(<<1, 2>>) + (0 * 1)) .. Head(Tail(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03754 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
