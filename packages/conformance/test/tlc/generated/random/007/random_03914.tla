(*---
description: Evaluates a random bool expression, seed 262, number 3914.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03914 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<3, 1, 2>>) % (-1 + 0)) - Cardinality({3, 2})) = (Len((<<>> \o <<1>>)) * LET b6171 == ({} \div 2147483647) IN ([a |-> 1]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
