(*---
description: Evaluates a random set expression, seed 262, number 1242.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01242 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Cardinality({7, 3}), (CHOOSE b1994 \in DOMAIN [x \in 1..2 |-> x] : (<<3, 1, 2>> = [x \in 1..2 |-> x]))} \cap (CHOOSE r \in [a : {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01242 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 40 to line 14, col 118 of module random_01242
---*)
