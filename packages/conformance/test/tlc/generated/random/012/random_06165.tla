(*---
description: Evaluates a random set expression, seed 262, number 6165.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06165 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({Head(<<>>), (2 \div 3)}) \div (LET b9483 == (2147483647 - 2147483647) IN LET b9484 == 2 IN -1 * (Head(<<1, 2>>) + Append(<<>>, 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06165 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
