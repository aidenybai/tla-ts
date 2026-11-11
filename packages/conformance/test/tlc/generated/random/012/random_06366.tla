(*---
description: Evaluates a random set expression, seed 262, number 6366.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06366 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [CASE FALSE -> 3 [] OTHER -> 3 EXCEPT ![IF [a |-> 1] THEN 2147483647 ELSE 3] = LET b9788 == 1 IN b9788] \cup {((-1) * ([a |-> 1]).a) : b9789 \in Cardinality(DOMAIN <<5, 6>>)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06366 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 64 to line 14, col 98 of module random_06366
---*)
