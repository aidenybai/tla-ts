(*---
description: Evaluates a random int expression, seed 262, number 3530.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03530 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b5579 \in (DOMAIN [b5580 \in SUBSET {1} |-> 0] \cap {b5581 \in UNION {{1, 2}, Nat} : ([a |-> 1] = [a |-> 1, b |-> TRUE])}) : ([b5582 \in DOMAIN [x \in Nat |-> x + 1] |-> (1 + 0)] = Cardinality({b5579 : b5583 \in {}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03530 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1, 2}
---*)
