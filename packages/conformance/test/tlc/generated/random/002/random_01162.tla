(*---
description: Evaluates a random set expression, seed 262, number 1162.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01162 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b1862 \in DOMAIN (CHOOSE f \in [1..2 -> {1, 2}] : TRUE) : (\A b1863 \in ((3 - b1862) .. (b1862 + b1862)) : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] < (7 % 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01162 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 4, b |-> TRUE]
---*)
