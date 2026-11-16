(*---
description: Evaluates a random bool expression, seed 262, number 8110.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08110 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\A b12534 \in [[a |-> 1] EXCEPT !.a = @ + 7] : (b12534 + b12534)) \/ ({b12535 : b12535 \in {x \in 1..3 : x > 1}} \subseteq (2..1 \ {}))) => (((3 = 1) \/ (FALSE <=> TRUE)) <=> (Head(<<3, 1, 2>>) < Cardinality({1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08110 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 8].
    line 14, col 33 to line 14, col 62 of module random_08110
---*)
