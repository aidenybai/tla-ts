(*---
description: Evaluates a random set expression, seed 262, number 4834.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04834 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(3 - [x \in Nat |-> x + 1]) : b7545 \in (2147483647 \in {2, 1, 3})}, UNION {DOMAIN [x \in 1..2 |-> x], {b7546 \in 2..1 : FALSE}}} \ (DOMAIN (0 @@ [x \in Nat |-> x + 1]) \ ({b7547 \in SUBSET {1} : FALSE} \ UNION {1..3, {x \in 1..3 : x > 1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04834 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 66 to line 14, col 89 of module random_04834
---*)
