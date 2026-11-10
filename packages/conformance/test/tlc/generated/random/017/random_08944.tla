(*---
description: Evaluates a random seq expression, seed 262, number 8944.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08944 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> [(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = ((CHOOSE b13875 \in 2..1 : FALSE) + (3 * 2))], b |-> ((-(-1 * 3)) \in {LET b13877 == b13876 IN TRUE : b13876 \in {b13878 : b13878 \in SUBSET {1}}})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08944 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 83 to line 14, col 112 of module random_08944
---*)
