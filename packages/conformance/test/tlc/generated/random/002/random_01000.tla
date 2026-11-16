(*---
description: Evaluates a random bool expression, seed 262, number 1000.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01000 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b1604 \in {([a |-> 1, b |-> TRUE]).a : b1605 \in {b1606 \in SUBSET {1} : TRUE}} : (({1, 2} = {1, 2}) \/ (FALSE \/ FALSE))) \in {(([a |-> 1, b |-> TRUE]).a - (CHOOSE b1607 \in {} : TRUE)), ([b1608 \in 2..1 |-> 2..1])[(CHOOSE b1609 \in {2, 1, 3} : FALSE)]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01000 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 183 to line 14, col 208 of module random_01000
---*)
