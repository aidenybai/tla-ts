(*---
description: Evaluates a random bool expression, seed 262, number 3187.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03187 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq((0 :> 0), LAMBDA p, q : p < q) \ (DOMAIN FALSE \cap ({x \in 1..3 : x > 1} \cup {1}))) = ((({} \ SUBSET {1}) \cap (-1 .. 1)) \ {(CHOOSE b5073 \in {} : FALSE) : b5072 \in {-1, 7}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    (0 :> 0)
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    (0 :> 0)
---*)
