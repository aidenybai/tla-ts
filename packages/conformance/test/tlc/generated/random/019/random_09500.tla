(*---
description: Evaluates a random bool expression, seed 262, number 9500.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09500 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({x \in 1..3 : x > 1}) :> LET b14759 == 2147483647 IN 0) \o SortSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA p, q : p < q)) = (-((0 - -1) + (1 + 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    (2 :> 0)
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    (2 :> 0)
---*)
