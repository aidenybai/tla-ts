(*---
description: Evaluates a random int expression, seed 262, number 4214.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04214 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({}) :> CASE FALSE -> 2147483647 [] OTHER -> 2) @@ ({0 : b6626 \in {2, 1, 3}} = (SUBSET {1} \cup {1}))))[(((FALSE /\ TRUE))[(1 * 0)] * ((CHOOSE b6627 \in {} : FALSE) - (2 % 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04214 failed.
    Attempted to compare the set {} with the value:
    1
---*)
