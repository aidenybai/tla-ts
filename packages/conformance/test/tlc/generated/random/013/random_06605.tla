(*---
description: Evaluates a random int expression, seed 262, number 6605.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06605 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(SortSeq(((<<1>> \o <<1>>) \o SubSeq(<<3, 1, 2>>, 2, 3)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06605 failed.
    2181:0 Attempted to compute cardinality of the value
    <<1, 1, 1, 2>>
---*)
