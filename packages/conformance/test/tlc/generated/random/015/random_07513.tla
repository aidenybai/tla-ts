(*---
description: Evaluates a random set expression, seed 262, number 7513.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07513 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1, 2} \cap {2, 1, 3}) \cup (2147483647 .. 2147483647)) \cap (({1, 2} \cup {2, 1, 3}) \cap ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]))) \cap UNION {{b11573 \in (7 .. 3) : (2147483647 = 3)}, {b11574 \in (1..3 \cap {2, 1, 3}) : (<<3, 1, 2>> = [x \in Nat |-> x + 1])}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07513 failed.
    Attempted to check if the value:
    1
    is an element of the boolean TRUE
---*)
