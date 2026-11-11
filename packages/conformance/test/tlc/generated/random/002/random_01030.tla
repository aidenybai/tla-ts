(*---
description: Evaluates a random int expression, seed 262, number 1030.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01030 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x])[2] + IF TRUE THEN 7 ELSE 3) :> CASE (\A b1657 \in [a |-> 1, b |-> TRUE] : TRUE) -> (0 - 2) [] OTHER -> Cardinality(Nat)))[[a |-> ([[x \in Nat |-> x + 1] EXCEPT ![3] = {}])[IF TRUE THEN 7 ELSE 3], b |-> (~(TRUE => FALSE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01030 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1, b |-> TRUE].
    line 14, col 90 to line 14, col 110 of module random_01030
---*)
