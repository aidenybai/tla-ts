(*---
description: Evaluates a random set expression, seed 262, number 6032.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06032 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(([TRUE EXCEPT !.a = @ + b9289]).a + (CHOOSE b9290 \in (Nat \cup 1..3) : DOMAIN (1 :> 2))) : b9289 \in {({-1 : b9291 \in 2..1})[(2147483647 - 2147483647)], LET b9292 == (7 % 3) IN ([a |-> 1]).a}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06032 failed.
    A non-function (a set of the form {e1, ... ,eN}) was applied as a function.
    line 14, col 121 to line 14, col 170 of module random_06032
---*)
