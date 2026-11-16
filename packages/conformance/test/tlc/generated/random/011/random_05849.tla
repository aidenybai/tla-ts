(*---
description: Evaluates a random function expression, seed 262, number 5849.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05849 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9023 \in {((-1 % 1) + (2147483647 - 2)), ([a |-> 7, b |-> TRUE]).a} |-> IF (\E b9024 \in {1, b9023} : (~{2, 1, 3})) THEN Cardinality({-1, b9023}) ELSE Head(SubSeq(<<1>>, 3, 3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05849 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a set of the form {e1, ... ,eN})
    line 14, col 121 to line 14, col 130 of module random_05849
---*)
