(*---
description: Evaluates a random record expression, seed 262, number 7278.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07278 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE))[IF ({1, 2} = {x \in 1..3 : x > 1}) THEN ([x \in 1..2 |-> x])[TRUE] ELSE Cardinality({1})], b |-> ((\A b11207 \in {1 : b11208 \in {1}} : (-1 \in SUBSET {1})) => ({b11209 \in {1} : TRUE} = (Nat \cap {2, 1, 3})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07278 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 69 of module random_07278
---*)
