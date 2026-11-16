(*---
description: Evaluates a random int expression, seed 262, number 2775.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02775 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE f \in [1..2 -> {1, 2}] : TRUE))[Head(<<1>>)] \div ((CHOOSE b4383 \in 2..1 : FALSE) - (CHOOSE b4384 \in {1} : TRUE))) \div ((CHOOSE r \in [a : {}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02775 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 79 to line 14, col 107 of module random_02775
---*)
