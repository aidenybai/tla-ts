(*---
description: Evaluates a random seq expression, seed 262, number 67.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00067 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append(SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), (3 * 3), LET b96 == 1 IN 1), IF (1..3 = <<1, 2>>) THEN Head(<<1, 2>>) ELSE Head(<<>>)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00067 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    <<1, 2>>
---*)
