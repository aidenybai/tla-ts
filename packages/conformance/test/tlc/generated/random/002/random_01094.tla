(*---
description: Evaluates a random bool expression, seed 262, number 1094.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01094 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b1743 \in {} : TRUE) .. (<<5, 6>>)[2147483647]) \cup ((2147483647 * [x \in 1..2 |-> x]) .. (1 - 1))) = (Cardinality(DOMAIN [x \in 1..2 |-> x]) .. (CHOOSE b1744 \in UNION {{2, 1, 3}, 1..3} : (\E b1745 \in SUBSET {1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01094 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 45 of module random_01094
---*)
