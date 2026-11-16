(*---
description: Evaluates a random record expression, seed 262, number 5437.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05437 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq((SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) \o SelectSeq(<<1, 2>>, LAMBDA e : e > 0)), LAMBDA e : e > 0) EXCEPT !.a = @ + Head(SortSeq(SubSeq({x \in 1..3 : x > 1}, -1, SUBSET {1}), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05437 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
