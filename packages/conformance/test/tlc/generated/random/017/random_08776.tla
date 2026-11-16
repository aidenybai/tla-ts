(*---
description: Evaluates a random set expression, seed 262, number 8776.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08776 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b13588 \in (((0 + -1) + (CHOOSE b13589 \in {1, 2} : FALSE)) .. ([[x \in 1..2 |-> x] EXCEPT ![<<1, 2>>] = 1])[(1 - 1)]) : (Cardinality(DOMAIN (1 :> 2)) \in {b13590 \in ([a |-> 1, b |-> TRUE] .. 0) : ({1, 2} \subseteq SUBSET {1})})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08776 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 42 to line 14, col 73 of module random_08776
---*)
