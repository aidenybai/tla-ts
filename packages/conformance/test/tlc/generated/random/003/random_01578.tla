(*---
description: Evaluates a random bool expression, seed 262, number 1578.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01578 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(({2147483647 : b2518 \in {1, 2}} \ DOMAIN [x \in Nat |-> x + 1]) \subseteq (({} \cap {}) \cup (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01578 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 114 to line 14, col 153 of module random_01578
---*)
