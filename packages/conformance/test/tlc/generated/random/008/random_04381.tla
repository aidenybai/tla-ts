(*---
description: Evaluates a random set expression, seed 262, number 4381.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04381 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-IF FALSE THEN 1 ELSE 2), ((<<5, 6>>)[0] + Head(<<>>))} \ DOMAIN [b6897 \in [b6898 \in 2147483647 |-> 1] |-> LET b6899 == b6897 IN b6897]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04381 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
