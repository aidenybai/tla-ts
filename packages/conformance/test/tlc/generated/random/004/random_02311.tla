(*---
description: Evaluates a random int expression, seed 262, number 2311.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02311 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (-1 < -1) -> LET b3655 == 7 IN b3655 [] OTHER -> LET b3656 == 7 IN b3656 - ((CHOOSE b3657 \in 2..1 : FALSE) * LET b3658 == 2 IN 2)) * SelectSeq(SubSeq(Append(<<>>, 2), Cardinality({1}), ([x \in Nat |-> x + 1])[2]), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02311 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 100 to line 14, col 128 of module random_02311
---*)
