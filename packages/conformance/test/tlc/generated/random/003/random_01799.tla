(*---
description: Evaluates a random record expression, seed 262, number 1799.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01799 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = (((CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE) @@ (2 :> 3)))[([a |-> 2, b |-> FALSE] + (CHOOSE b2849 \in {} : FALSE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01799 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 47 of module random_01799
---*)
