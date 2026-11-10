(*---
description: Evaluates a random function expression, seed 262, number 3875.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03875 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6099 \in (Head(<<0, 1>>) .. IF (1..3 = SUBSET {1}) THEN (-1) ELSE LET b6100 == 3 IN 2147483647) |-> (-((7 \div 2147483647) + Cardinality({2, 1, 3})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03875 failed.
    Size of interval value exceeds the maximum representable size (32bits): 0..2147483647.
---*)
