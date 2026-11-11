(*---
description: Evaluates a random bool expression, seed 262, number 8114.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08114 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(-2), LET b12540 == 2147483647 IN b12540}, {b12541 \in UNION {Nat, {2, 1, 3}} : (~TRUE)}} = (({3, 1} \cup DOMAIN [x \in 1..2 |-> x]) \ {(2147483647 - 7), (2..1 \subseteq {1})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08114 failed.
    Attempted to compare equality of boolean TRUE with non-boolean:
    3
---*)
