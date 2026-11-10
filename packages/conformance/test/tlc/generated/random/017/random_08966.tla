(*---
description: Evaluates a random record expression, seed 262, number 8966.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08966 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + CASE (~TRUE) -> ([x \in 1..2 |-> x])[-1] [] OTHER -> Cardinality({})] EXCEPT !.a = (([2 EXCEPT !.a = @ + 3] - (-1)) - ((TRUE).a * (CHOOSE b13905 \in 2..1 : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08966 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 46 of module random_08966
---*)
