(*---
description: Evaluates a random record expression, seed 262, number 4881.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04881 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (CHOOSE b7600 \in {1, 2} : FALSE), b |-> (3 \in Nat)] EXCEPT !.a = (CHOOSE b7601 \in {b7602 \in FALSE : TRUE} : (FALSE \/ FALSE))] EXCEPT !.a = @ + (-[a |-> (FALSE /\ FALSE), b |-> (TRUE => TRUE)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04881 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 56 of module random_04881
---*)
