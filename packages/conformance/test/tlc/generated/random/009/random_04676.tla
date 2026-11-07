(*---
description: Evaluates a random record expression, seed 262, number 4676.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04676 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = (([a |-> 1, b |-> TRUE]).a * Cardinality({x \in 1..3 : x > 1}))] EXCEPT !.a = @ + Head(SortSeq(Tail(<<>>), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04676 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 48 of module random_04676
---*)
