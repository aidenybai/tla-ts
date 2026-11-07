(*---
description: Evaluates a random set expression, seed 262, number 3133.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03133 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((CHOOSE b5006 \in {b5007 : b5007 \in SUBSET {1}} : (7 \in {x \in 1..3 : x > 1})) :> ([(1 :> 2) EXCEPT ![2147483647] = 7])[Cardinality(SUBSET {1})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03133 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 102 of module random_03133
---*)
