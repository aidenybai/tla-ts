(*---
description: Evaluates a random function expression, seed 262, number 8675.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08675 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] EXCEPT !.a = @ + (7 % 7)] EXCEPT !.a = ((-2) + Cardinality(1..3))] @@ (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08675 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 134 to line 14, col 173 of module random_08675
---*)
