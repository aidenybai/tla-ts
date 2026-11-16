(*---
description: Evaluates a random bool expression, seed 262, number 9957.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09957 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Cardinality(2..1) : b15483 \in {2, 3}} \cap UNION {{2147483647 : b15484 \in {1, 2}}, DOMAIN [x \in Nat |-> x + 1]}) = (((1 % 0) * (-2)) \cup {IF TRUE THEN 1 ELSE 3, (CHOOSE b15485 \in {} : FALSE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09957 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {2147483647}
---*)
