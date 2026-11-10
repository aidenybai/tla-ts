(*---
description: Evaluates a random int expression, seed 262, number 2675.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02675 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b4225 \in ({2147483647, 1} \cap UNION {2..1, {1}}) : ((2 % -1) \in {b4226 \in {2, 1, 3} : FALSE})) + (((-1 :> 3))[(-2)] - ((7 % 2147483647) \div (2 - 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02675 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
