(*---
description: Evaluates a random set expression, seed 262, number 8001.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08001 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b12353 \in (DOMAIN [x \in 1..2 |-> x] \cap DOMAIN [x \in 1..2 |-> x]) : ((CHOOSE b12354 \in 2..1 : FALSE) = (1 * b12353))} \cap UNION {(Cardinality({}) .. (7 + 3)), (({1, 2} \ 2..1) \cup UNION {Nat, {2, 1, 3}})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08001 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 92 to line 14, col 121 of module random_08001
---*)
