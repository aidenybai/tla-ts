(*---
description: Evaluates a random bool expression, seed 262, number 8522.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08522 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(Cardinality({0, 1}) = {(CHOOSE b13205 \in {} : TRUE) : b13204 \in (SUBSET {1} \cap Nat)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08522 failed.
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
---*)
