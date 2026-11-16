(*---
description: Evaluates a random int expression, seed 262, number 3791.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03791 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(CHOOSE b5981 \in (UNION {1..3, Nat} \ UNION {{1, 2}, {1}}) : (~(SUBSET {1} \subseteq {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03791 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    1..3
---*)
