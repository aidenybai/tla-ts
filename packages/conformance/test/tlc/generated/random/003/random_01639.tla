(*---
description: Evaluates a random record expression, seed 262, number 1639.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01639 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + 0] EXCEPT !.a = @ + (CHOOSE b2626 \in {2, 1, 3} : FALSE)] EXCEPT !.a = (-(FALSE \/ FALSE))] EXCEPT !.a = (([<<1, 2>> EXCEPT ![1] = 2] \div ([x \in 1..2 |-> x])[0]) \div CASE (-1 \in Nat) -> (CHOOSE b2627 \in 1..3 : FALSE) [] OTHER -> (-1 - TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01639 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 68 to line 14, col 101 of module random_01639
---*)
