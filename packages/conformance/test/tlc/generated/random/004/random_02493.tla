(*---
description: Evaluates a random int expression, seed 262, number 2493.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02493 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b3922 \in UNION {({1, 2} \cup {}), ({} \cup 2..1)} : ({7 : b3923 \in {1}} \subseteq (b3922 .. 1))) * ([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + LET b3924 == 1 IN Nat]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02493 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 121 of module random_02493
---*)
