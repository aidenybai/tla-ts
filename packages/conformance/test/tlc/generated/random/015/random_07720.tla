(*---
description: Evaluates a random seq expression, seed 262, number 7720.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07720 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SortSeq(SubSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), (-0), ([x \in 1..2 |-> x])[FALSE]), LAMBDA p, q : p < q), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07720 failed.
    Attempted to check if the value:
    FALSE
    is in the integer interval 1..2
---*)
