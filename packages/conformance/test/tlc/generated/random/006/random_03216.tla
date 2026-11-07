(*---
description: Evaluates a random record expression, seed 262, number 3216.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03216 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head(Append(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), Cardinality(1..3))), b |-> ((CHOOSE b5107 \in {b5108 \in 1..3 : TRUE} : (TRUE <=> TRUE)) < (Cardinality(2..1) - (2 % 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
