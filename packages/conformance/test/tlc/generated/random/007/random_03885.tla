(*---
description: Evaluates a random bool expression, seed 262, number 3885.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03885 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~[b6119 \in (DOMAIN [x \in Nat |-> x + 1] \ ({2, 1, 3} \ 2..1)) |-> (Cardinality(SUBSET {1}) \div (b6119 % 2147483647))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03885 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a function of the form  [x \in S |-> expr])
    line 14, col 17 to line 14, col 136 of module random_03885
---*)
