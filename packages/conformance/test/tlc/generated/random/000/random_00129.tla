(*---
description: Evaluates a random int expression, seed 262, number 129.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00129 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-LET b199 == (LET b200 == 7 IN 3 \div (7 * 2)) IN (Cardinality({1, 2}) % (-0))))
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
