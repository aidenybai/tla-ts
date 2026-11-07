(*---
description: Evaluates a random seq expression, seed 262, number 1670.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01670 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(Append(<<7, 2147483647>>, (7 % 0)), LAMBDA p, q : p < q) EXCEPT ![1] = (((-1) + (0 * 2)) \div (Cardinality({x \in 1..3 : x > 1}) * (3 - 1)))])
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
