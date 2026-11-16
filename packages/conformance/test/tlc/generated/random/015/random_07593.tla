(*---
description: Evaluates a random int expression, seed 262, number 7593.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07593 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b11681 \in UNION {{b11682 \in {} : FALSE}, ({1, 2} \ Nat)} : (([a |-> 1] = [a |-> 1]) <=> {b11683 : b11683 \in {1}})) * Cardinality({(CHOOSE b11684 \in {1} : FALSE), (1 % 3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07593 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 140 of module random_07593
---*)
