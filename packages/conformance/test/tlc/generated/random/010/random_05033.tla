(*---
description: Evaluates a random record expression, seed 262, number 5033.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05033 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((<<5, 6>>)[2] = (-1 - 1)) -> (((1 :> 2))[1] + LET b7827 == <<>> IN b7827) [] OTHER -> LET b7828 == (0 \div 2147483647) IN (-1 \div b7828), b |-> (~((CHOOSE r \in [a : {1}] : TRUE) = (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
