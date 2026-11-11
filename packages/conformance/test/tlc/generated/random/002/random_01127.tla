(*---
description: Evaluates a random function expression, seed 262, number 1127.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01127 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} -> {}] : TRUE) EXCEPT ![(LET b1806 == (1 + 1) IN (b1806 % -1) + ([[a |-> 1] EXCEPT !.a = @ + 3]).a)] = Cardinality({(-[a |-> 1, b |-> TRUE]) : b1807 \in DOMAIN <<5, 6>>})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01127 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 51 of module random_01127
---*)
