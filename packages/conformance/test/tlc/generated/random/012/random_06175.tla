(*---
description: Evaluates a random seq expression, seed 262, number 6175.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06175 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b9499 \in ({b9500 \in 1..3 : FALSE} \cup ({x \in 1..3 : x > 1} \ {2, 1, 3})) : (({1, 2} .. 7) \subseteq (TRUE .. b9499))) < Cardinality(((CHOOSE b9501 \in SUBSET {1} : FALSE) .. (<<>>)[2]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06175 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 144 of module random_06175
---*)
