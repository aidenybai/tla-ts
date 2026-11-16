(*---
description: Evaluates a random bool expression, seed 262, number 5561.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05561 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = [a |-> Cardinality((Nat \cap SUBSET {1})), b |-> ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) = (CHOOSE b8611 \in 1..3 : TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05561 failed.
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
---*)
