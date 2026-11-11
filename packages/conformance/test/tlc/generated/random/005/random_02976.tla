(*---
description: Evaluates a random seq expression, seed 262, number 2976.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02976 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((SortSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q) \o ((2..1 \cap {x \in 1..3 : x > 1}) \cup {b4725 \in 1..3 : FALSE})), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02976 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {}
---*)
