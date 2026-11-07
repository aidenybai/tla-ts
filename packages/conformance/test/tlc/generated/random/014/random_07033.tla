(*---
description: Evaluates a random int expression, seed 262, number 7033.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07033 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((LET b10787 == 7 IN b10787 .. (-1 + 2147483647))) * (((2147483647 + 1) * Cardinality(1..3)) + ((1 % 0) + (2 % -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
