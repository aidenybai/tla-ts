(*---
description: Evaluates a random record expression, seed 262, number 1026.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01026 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + ((CHOOSE b1656 \in (SUBSET {1} \cap 1..3) : ({x \in 1..3 : x > 1} = SUBSET {1})) + IF (TRUE \/ FALSE) THEN Cardinality(2..1) ELSE ([a |-> 1]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01026 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 47 of module random_01026
---*)
