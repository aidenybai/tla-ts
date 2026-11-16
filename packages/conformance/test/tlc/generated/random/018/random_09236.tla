(*---
description: Evaluates a random seq expression, seed 262, number 9236.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09236 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(2 % 3), (3 + 0)} \subseteq ((CHOOSE b14333 \in {1} : FALSE) .. (-2))) \o Cardinality({b14334 \in (Nat \cup [a |-> 1]) : (TRUE \/ TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09236 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 49 to line 14, col 77 of module random_09236
---*)
