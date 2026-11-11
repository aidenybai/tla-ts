(*---
description: Evaluates a random function expression, seed 262, number 6588.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06588 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-LET b10115 == (1 % [a |-> 1, b |-> TRUE]) IN LET b10116 == 1 IN b10116) :> ((CHOOSE r \in [a : {}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06588 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 96 to line 14, col 123 of module random_06588
---*)
