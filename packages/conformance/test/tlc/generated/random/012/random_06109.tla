(*---
description: Evaluates a random record expression, seed 262, number 6109.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06109 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (CHOOSE b9400 \in {} : TRUE), b |-> (<<>> = <<5, 6>>)] EXCEPT !.a = @ + ([b9401 \in 1..3 |-> 2])[(0 \div 7)]] EXCEPT !.a = @ + (CHOOSE b9402 \in (Cardinality(1..3) .. (2..1 \subseteq {1, 2})) : ((TRUE => TRUE) /\ (FALSE /\ TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06109 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 51 of module random_06109
---*)
