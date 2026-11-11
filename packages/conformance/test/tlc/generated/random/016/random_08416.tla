(*---
description: Evaluates a random int expression, seed 262, number 8416.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08416 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality({-1, -1}) - Head(<<2, 7>>)) % (((2147483647 :> 2147483647))[(CHOOSE b13022 \in 2..1 : FALSE)] \div Cardinality(({2, 1, 3} \ 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08416 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 91 to line 14, col 120 of module random_08416
---*)
