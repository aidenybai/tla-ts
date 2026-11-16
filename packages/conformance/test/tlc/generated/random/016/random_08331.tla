(*---
description: Evaluates a random bool expression, seed 262, number 8331.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08331 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> LET b12886 == 7 IN -1, b |-> (TRUE => FALSE)]).a = (CHOOSE b12887 \in ({7, 1} \cap {2 : b12888 \in {x \in 1..3 : x > 1}}) : ((TRUE <=> b12887) <=> (b12887 \in {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08331 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 194 of module random_08331
---*)
