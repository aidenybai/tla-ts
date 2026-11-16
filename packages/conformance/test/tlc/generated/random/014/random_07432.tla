(*---
description: Evaluates a random int expression, seed 262, number 7432.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07432 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b11458 \in {(([a |-> 1, b |-> TRUE]).a * (7 - 2147483647)), ((CHOOSE b11459 \in {} : TRUE) \div <<-1, 7>>)} : ((-(b11458 * 3)) \in {(-1 + 2147483647) : b11460 \in {b11461 : b11461 \in Nat}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07432 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 86 to line 14, col 112 of module random_07432
---*)
