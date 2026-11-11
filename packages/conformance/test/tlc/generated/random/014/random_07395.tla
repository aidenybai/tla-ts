(*---
description: Evaluates a random set expression, seed 262, number 7395.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07395 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((-(CHOOSE b11388 \in {x \in 1..3 : x > 1} : FALSE)) % (Head(<<1, 2>>) * (CHOOSE b11389 \in {} : FALSE))) : b11387 \in {(Len(<<>>) - (-1)), LET b11390 == Cardinality(1..3) IN Head(<<1>>)}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07395 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 21 to line 14, col 66 of module random_07395
---*)
