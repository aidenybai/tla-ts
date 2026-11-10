(*---
description: Evaluates a random record expression, seed 262, number 1844.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01844 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = (CHOOSE b2917 \in (3 .. 0) : (b2917 < b2917))] EXCEPT !.a = @ + ((CASE TRUE -> -1 [] OTHER -> 0 % Head(<<1, 2>>)) * ((-1 :> 2))[([a |-> 1, b |-> TRUE]).a])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01844 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 46 of module random_01844
---*)
