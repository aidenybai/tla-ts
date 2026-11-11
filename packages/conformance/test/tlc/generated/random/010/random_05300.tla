(*---
description: Evaluates a random int expression, seed 262, number 5300.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05300 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b8205 \in DOMAIN (CHOOSE f \in [2..1 -> {1}] : TRUE) : ((b8205 < [a |-> 1, b |-> TRUE]) \/ ([a |-> 1] = [a |-> 1, b |-> TRUE]))) \div CASE ((2 \div 1) = UNION {1..3, Nat}) -> (([x \in Nat |-> x + 1])[TRUE] * (2147483647 + -1)) [] OTHER -> (-IF TRUE THEN 0 ELSE 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05300 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 151 of module random_05300
---*)
