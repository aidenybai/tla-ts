(*---
description: Evaluates a random int expression, seed 262, number 2726.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02726 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b4301 == Head((SubSeq(<<3, 1, 2>>, {2, 1, 3}, 7) \o SortSeq(<<1, 2>>, LAMBDA p, q : p < q))) IN LET b4302 == (CASE TRUE -> b4301 [] OTHER -> {1, 2} + Cardinality({1})) IN (Head(<<>>) % (3 * b4301)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
