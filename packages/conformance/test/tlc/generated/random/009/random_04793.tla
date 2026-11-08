(*---
description: Evaluates a random function expression, seed 262, number 4793.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04793 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SelectSeq(<<>>, LAMBDA e : e > 0)) - ((-2) * (2147483647 \div 0))) :> Head(SortSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04793 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
