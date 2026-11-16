(*---
description: Evaluates a random function expression, seed 262, number 6575.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06575 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(Len(<<1>>) .. (3 - 3)) EXCEPT ![Cardinality({1, 7})] = (~UNION {1..3, {x \in 1..3 : x > 1}})] @@ [(CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE) EXCEPT ![(-Head(<<1, 2>>))] = ((3 - 7) + (2147483647 + 7))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06575 failed.
    Attempted to apply EXCEPT construct to the value {}.
---*)
