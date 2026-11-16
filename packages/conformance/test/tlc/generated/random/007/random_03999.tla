(*---
description: Evaluates a random int expression, seed 262, number 3999.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03999 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b6289 \in UNION {DOMAIN (CHOOSE f \in [1..2 -> {}] : TRUE), DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![1] = 2]} : (((7 \in {}) \/ (<<3, 1, 2>> = [x \in Nat |-> x + 1])) <=> ([<<3, 1, 2>> EXCEPT ![1] = b6289] = (b6289 :> b6289)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03999 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 49 to line 14, col 80 of module random_03999
---*)
