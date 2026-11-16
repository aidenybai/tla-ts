(*---
description: Evaluates a random bool expression, seed 262, number 3017.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03017 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b4795 \in {1} : FALSE) * Cardinality(1)) - ((7 \div {1, 2}) * (CHOOSE b4796 \in 1..3 : TRUE))) = {b4797 \in ({b4798 : b4798 \in 1..3} \cup {2147483647 : b4799 \in {2, 1, 3}}) : ((7 * 1) < Head(<<3, 1, 2>>))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03017 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 47 of module random_03017
---*)
