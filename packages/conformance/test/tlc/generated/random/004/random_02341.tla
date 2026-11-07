(*---
description: Evaluates a random int expression, seed 262, number 2341.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02341 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({(((1 :> 2))[-1] \div (CHOOSE b3713 \in {1, 2} : FALSE)) : b3712 \in (CASE TRUE -> 1 [] OTHER -> 7 .. ([x \in Nat |-> x + 1])[2147483647])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02341 failed.
    TLC encountered a non-enumerable quantifier bound
    1.
    line 14, col 98 to line 14, col 164 of module random_02341
---*)
