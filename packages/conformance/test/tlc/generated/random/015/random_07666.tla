(*---
description: Evaluates a random record expression, seed 262, number 7666.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07666 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-(Cardinality({2, 1, 3}) * (2147483647 \div 2147483647))), b |-> ((Head(<<3, 1, 2>>) % (CHOOSE b11800 \in 2..1 : TRUE)) \in ({-1 : b11801 \in SUBSET {1}} \ ({2, 1, 3} \ Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07666 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 112 to line 14, col 140 of module random_07666
---*)
