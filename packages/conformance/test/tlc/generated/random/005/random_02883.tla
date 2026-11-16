(*---
description: Evaluates a random record expression, seed 262, number 2883.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02883 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + (CASE ([a |-> 1] = [a |-> 1]) -> (1 % 2147483647) [] OTHER -> (CHOOSE b4570 \in {x \in 1..3 : x > 1} : FALSE) - ([(1 :> 2) EXCEPT ![7] = 3])[(2 - 0)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02883 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 47 of module random_02883
---*)
