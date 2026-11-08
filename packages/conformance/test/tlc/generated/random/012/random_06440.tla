(*---
description: Evaluates a random bool expression, seed 262, number 6440.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06440 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b9908 \in (({1, 7} \cup (2..1 \ SUBSET {1})) \cup ((3 + 7) .. IF TRUE THEN -1 ELSE 3)) : ({(b9908 % 0), CASE FALSE -> 2 [] OTHER -> 2147483647} \cup {b9909 \in (1..3 \ {x \in 1..3 : x > 1}) : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06440 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
