(*---
description: Evaluates a random int expression, seed 262, number 4184.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04184 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b6581 \in {b6582 \in ((3 .. 1) \ {b6583 \in {} : FALSE}) : (\E b6584 \in DOMAIN [x \in Nat |-> x + 1] : (TRUE \/ TRUE))} : ((LET b6585 == b6581 IN -1 < Cardinality({1})) \/ (({1} \ {2, 1, 3}) \cap {b6586 \in {x \in 1..3 : x > 1} : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04184 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 262 of module random_04184
---*)
