(*---
description: Evaluates a random bool expression, seed 262, number 4052.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04052 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {({1, 0} \ UNION {{2, 1, 3}, SUBSET {1}}), UNION {(3 .. -1), ({} \ {x \in 1..3 : x > 1})}} = ((({x \in 1..3 : x > 1} \cap {2, 1, 3}) \cap (-1 .. 2)) \cup (LET b6380 == 7 IN b6380 .. ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04052 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
