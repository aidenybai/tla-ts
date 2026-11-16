(*---
description: Evaluates a random seq expression, seed 262, number 521.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00521 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = Cardinality({1})] \o <<IF TRUE THEN -1 ELSE 1, IF FALSE THEN -1 ELSE 1>>), (CHOOSE b881 \in [[a |-> -1, b |-> TRUE] EXCEPT !.a = (-1)] : (Head(<<1>>) < Cardinality({x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00521 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 55 of module random_00521
---*)
