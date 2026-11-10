(*---
description: Evaluates a random bool expression, seed 262, number 5177.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05177 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {((0 .. 2) \ {2147483647 : b8030 \in {2, 1, 3}}), UNION {{b8031 : b8031 \in {1, 2}}, (1 .. 1)}} = (({-1, 1} \ DOMAIN 1) \cap {(b8032 * b8032) : b8032 \in (7 .. 1)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05177 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 133 to line 14, col 140 of module random_05177
---*)
