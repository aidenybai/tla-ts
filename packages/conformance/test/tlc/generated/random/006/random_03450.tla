(*---
description: Evaluates a random record expression, seed 262, number 3450.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03450 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = ((CHOOSE b5469 \in {1, 2} : FALSE) * (2 \div 1))] EXCEPT !.a = ((-LET b5470 == 1 IN b5470) * ((0 % 2) \div Cardinality(SUBSET {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03450 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 74 to line 14, col 104 of module random_03450
---*)
