(*---
description: Evaluates a random bool expression, seed 262, number 5209.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05209 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1} -> 2..1] : TRUE))[CASE (TRUE \/ FALSE) -> Cardinality({}) [] OTHER -> (2 - FALSE)] \in ((({1, 2} \ SUBSET {1}) \cup (2147483647 - 0)) \cap DOMAIN ([x \in 1..2 |-> x] @@ <<5, 6>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05209 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 51 of module random_05209
---*)
