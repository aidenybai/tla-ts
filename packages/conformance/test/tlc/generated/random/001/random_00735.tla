(*---
description: Evaluates a random record expression, seed 262, number 735.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00735 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = (CHOOSE b1205 \in (DOMAIN (1 :> 2) \ DOMAIN [x \in Nat |-> x + 1]) : (\A b1206 \in (1 .. b1205) : (FALSE /\ FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00735 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 64 to line 14, col 177 of module random_00735
---*)
