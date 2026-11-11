(*---
description: Evaluates a random record expression, seed 262, number 4782.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04782 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-(-Cardinality({1, 2}))), b |-> (\E b7466 \in {(CHOOSE b7467 \in {1} : TRUE), (CHOOSE b7468 \in {} : FALSE)} : ((b7466 \in {}) <=> (~TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04782 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 103 to line 14, col 129 of module random_04782
---*)
