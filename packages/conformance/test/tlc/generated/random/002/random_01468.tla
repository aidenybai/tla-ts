(*---
description: Evaluates a random int expression, seed 262, number 1468.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01468 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1, 2} \cap {2} -> {}] : TRUE))[(LET b2341 == {1, 2} IN 2147483647 - (CHOOSE b2342 \in 1..3 : FALSE))] + CASE Cardinality(UNION {2..1, {1}}) -> (([x \in Nat |-> x + 1])[7] .. (<<1>> - 1)) [] OTHER -> {(2147483647 % 1) : b2343 \in {1, 3}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01468 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 61 of module random_01468
---*)
