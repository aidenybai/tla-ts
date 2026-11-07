(*---
description: Evaluates a random bool expression, seed 262, number 9778.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09778 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(<<{-1, 1}, (-1 + -1)>>) \div Len(<<(CHOOSE b15180 \in 2..1 : <<1, 2>>), IF TRUE THEN 7 ELSE 7>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09778 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 57 to line 14, col 89 of module random_09778
---*)
