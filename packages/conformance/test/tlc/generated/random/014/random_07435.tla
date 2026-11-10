(*---
description: Evaluates a random bool expression, seed 262, number 7435.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07435 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b11463 \in {Cardinality({1, 2}) : b11464 \in (1..3 \ SUBSET {1})} : (DOMAIN [x \in 1..2 |-> x] < (0 * b11463))) \/ ((CASE [a |-> 1, b |-> TRUE] -> 1 [] OTHER -> 2 - (-1 \div 7)) \in (({x \in 1..3 : x > 1} \cup [x \in 1..2 |-> x]) \cap {0, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07435 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
