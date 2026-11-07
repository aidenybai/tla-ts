(*---
description: Evaluates a random function expression, seed 262, number 9241.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09241 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14346 \in DOMAIN (CHOOSE f \in [1..2 -> {}] : TRUE) |-> ((Head(<<>>) % ([a |-> 1, b |-> TRUE]).a) - (LET b14347 == 2 IN b14346 \div Head(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09241 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 36 to line 14, col 67 of module random_09241
---*)
