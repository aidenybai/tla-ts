(*---
description: Evaluates a random set expression, seed 262, number 8517.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08517 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-2147483647) - (-3)) - (CHOOSE b13198 \in ([a |-> 1, b |-> TRUE] \cup {}) : (<<>> = <<5, 6>>))) .. (-Cardinality((CHOOSE f \in [{0} \cup {1} -> {2, 1, 3}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08517 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 44 to line 14, col 112 of module random_08517
---*)
