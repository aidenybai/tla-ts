(*---
description: Evaluates a random set expression, seed 262, number 8723.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08723 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {LET b13510 == (CHOOSE b13511 \in {b13512 : b13512 \in SUBSET {1}} : (1..3 = {x \in 1..3 : x > 1})) IN Len(<<b13510, 3>>), (DOMAIN (SUBSET {1} \cap [a |-> 1]) \cap UNION {({} \cap 1..3), (1..3 \ 1..3)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08723 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 38 to line 14, col 119 of module random_08723
---*)
