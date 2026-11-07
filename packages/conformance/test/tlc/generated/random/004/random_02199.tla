(*---
description: Evaluates a random function expression, seed 262, number 2199.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02199 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(({7 : b3457 \in {1, 2}} \cap (CHOOSE b3458 \in 2..1 : TRUE))) :> (CASE (TRUE => FALSE) -> (-7) [] OTHER -> IF FALSE THEN 1 ELSE 1 * ((7 % 2147483647) % Cardinality((1 :> 2))))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02199 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 59 to line 14, col 86 of module random_02199
---*)
