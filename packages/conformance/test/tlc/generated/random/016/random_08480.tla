(*---
description: Evaluates a random function expression, seed 262, number 8480.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08480 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13127 \in DOMAIN ((CHOOSE b13128 \in 2..1 : TRUE) :> (FALSE => TRUE)) |-> ([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + Head(<<3, 1, 2>>)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08480 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 37 to line 14, col 65 of module random_08480
---*)
