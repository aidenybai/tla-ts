(*---
description: Evaluates a random set expression, seed 262, number 145.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00145 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(SortSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA p, q : p < q)), ((Head(<<1, 2>>) * Len(<<>>)) % Cardinality(UNION {1..3, 1..3}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00145 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
