(*---
description: Evaluates a random set expression, seed 262, number 6507.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06507 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b10003 \in (Cardinality(DOMAIN (1 :> 2)) \cup {(CHOOSE b10004 \in {x \in 1..3 : x > 1} : FALSE), ([x \in Nat |-> x + 1])[0]}) : ((DOMAIN [x \in Nat |-> x + 1] = DOMAIN [x \in 1..2 |-> x]) /\ (((1 :> 2) \/ TRUE) => (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06507 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 65 to line 14, col 110 of module random_06507
---*)
