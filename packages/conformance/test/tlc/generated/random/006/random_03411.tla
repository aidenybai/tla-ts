(*---
description: Evaluates a random bool expression, seed 262, number 3411.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03411 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b5413 \in {x \in 1..3 : x > 1} : FALSE) * IF TRUE THEN 2147483647 ELSE 0) + (-CASE FALSE -> 3 [] OTHER -> 2)) \in DOMAIN ((2147483647 % 2147483647) :> (3 \div {1, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03411 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 64 of module random_03411
---*)
