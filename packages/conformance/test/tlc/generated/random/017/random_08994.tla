(*---
description: Evaluates a random set expression, seed 262, number 8994.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08994 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE b13970 \in {1} : FALSE) \div IF TRUE THEN 7 ELSE -1) + LET b13971 == (0 % 3) IN ([a |-> 1]).a), Cardinality(DOMAIN (2 :> 2147483647))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08994 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 48 of module random_08994
---*)
