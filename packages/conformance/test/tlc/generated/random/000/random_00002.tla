(*---
description: Evaluates a random int expression, seed 262, number 2.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00002 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-2147483647) - (CHOOSE b3 \in {} : FALSE)) - ((~TRUE) /\ (TRUE <=> TRUE))) \div (CASE (TRUE \/ FALSE) -> Head(<<1>>) [] OTHER -> (-7) % Cardinality({3, 0}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00002 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 36 to line 14, col 59 of module random_00002
---*)
