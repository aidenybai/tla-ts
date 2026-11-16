(*---
description: Evaluates a random function expression, seed 262, number 8502.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08502 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b13167 \in ({b13168 : b13168 \in 2..1} \ ({1} \cap {1, 2})) : ((CHOOSE b13169 \in Nat : FALSE) < (b13167 \div b13167))) @@ (LET b13170 == (3 % 3) IN IF FALSE THEN b13170 ELSE b13170 :> ((1 + 1) % (2 % 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08502 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 142 of module random_08502
---*)
