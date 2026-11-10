(*---
description: Evaluates a random bool expression, seed 262, number 1692.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01692 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = <<1>>] EXCEPT !.a = @ + (CHOOSE b2701 \in {2, 1, 3} : FALSE)]).a \in {(-(CHOOSE b2703 \in 1..3 : FALSE)) : b2702 \in UNION {(0 \ 2..1), {7, 2}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01692 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 80 to line 14, col 113 of module random_01692
---*)
