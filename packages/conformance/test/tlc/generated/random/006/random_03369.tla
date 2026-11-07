(*---
description: Evaluates a random bool expression, seed 262, number 3369.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03369 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(CASE (TRUE /\ TRUE) -> Len(<<1, 2>>) [] OTHER -> (<<5, 6>>)[2147483647] \in (CHOOSE r \in [a : {}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03369 failed.
    Attempted to apply the operator ~ to a non-boolean
    (an integer)
    line 14, col 17 to line 14, col 125 of module random_03369
---*)
