(*---
description: Evaluates a random function expression, seed 262, number 3550.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03550 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5613 \in (LET b5614 == (0 + 2147483647) IN Cardinality({1, 2}) + Head(SortSeq(<<>>, LAMBDA p, q : p < q))) |-> Head(SelectSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03550 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
