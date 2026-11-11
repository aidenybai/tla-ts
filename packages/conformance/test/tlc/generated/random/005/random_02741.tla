(*---
description: Evaluates a random seq expression, seed 262, number 2741.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02741 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN (3 - 2) ELSE ([a |-> 1, b |-> TRUE]).a, Cardinality({-1, 3})>> EXCEPT ![1] = CASE (~[b4329 \in 2..1 |-> 7]) -> Cardinality(({1} \ <<5, 6>>)) [] OTHER -> (Cardinality({}) * (-1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02741 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN))
    line 14, col 146 to line 14, col 168 of module random_02741
---*)
