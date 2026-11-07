(*---
description: Evaluates a random int expression, seed 262, number 6405.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06405 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(DOMAIN [b9855 \in DOMAIN (1 :> 2) |-> (CHOOSE b9856 \in {x \in 1..3 : x > 1} : FALSE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06405 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 67 to line 14, col 111 of module random_06405
---*)
