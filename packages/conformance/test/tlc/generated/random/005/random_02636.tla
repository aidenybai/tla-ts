(*---
description: Evaluates a random record expression, seed 262, number 2636.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02636 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head(Append((\E b4160 \in 1..3 : FALSE), Cardinality({x \in 1..3 : x > 1}))), b |-> (SortSeq(SubSeq(<<1>>, 3, 7), LAMBDA p, q : p < q) = [[FALSE EXCEPT ![2] = 2] EXCEPT ![(0 % 1)] = (-0)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02636 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    FALSE
---*)
