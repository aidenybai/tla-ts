(*---
description: Evaluates a random set expression, seed 262, number 3772.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03772 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Tail(<<2147483647, 2147483647>>) : b5953 \in {b5954 \in UNION {1..3, SUBSET {1}} : {2147483647 : b5955 \in {2, 1, 3}}}} \ (({b5956 : b5956 \in {1}} \cap UNION {1..3, {x \in 1..3 : x > 1}}) \cup {(CHOOSE b5958 \in TRUE : TRUE) : b5957 \in {1, 7}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03772 failed.
    Evaluating predicate line 14, col 101 to line 14, col 134 of module random_03772 yielded non-Boolean value.
---*)
