(*---
description: Evaluates a random set expression, seed 262, number 1525.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01525 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((1 \div 1) \div (-7)) - ((CHOOSE b2422 \in 1..3 : FALSE) \div (2147483647 % 2))), ((CHOOSE r \in [a : {1}] : TRUE)).a})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01525 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 45 to line 14, col 73 of module random_01525
---*)
