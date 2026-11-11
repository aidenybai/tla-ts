(*---
description: Evaluates a random record expression, seed 262, number 1770.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01770 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE f \in [{1, 2} -> 2..1] : TRUE), b |-> ([[2147483647 EXCEPT !.a = @ + 3] EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a] /\ (~(~TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01770 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 59 of module random_01770
---*)
