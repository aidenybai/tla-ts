(*---
description: Evaluates a random record expression, seed 262, number 745.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00745 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = (CHOOSE b1223 \in (DOMAIN <<5, 6>> \cap (-1 .. 1)) : ({b1223 : b1224 \in {x \in 1..3 : x > 1}} \subseteq (2..1 \ Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00745 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 63 to line 14, col 179 of module random_00745
---*)
