(*---
description: Evaluates a random bool expression, seed 262, number 9113.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09113 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([<<(CHOOSE b14161 \in {} : TRUE), LET b14162 == 1 IN b14162>> EXCEPT ![1] = CASE (<<1, 2>> = <<3, 1, 2>>) -> (7 + 7) [] OTHER -> IF TRUE THEN [x \in Nat |-> x + 1] ELSE 2] = [b14163 \in [(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a] |-> ((<<>> % b14163) \div ([x \in 1..2 |-> x])[7])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09113 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 21 to line 14, col 47 of module random_09113
---*)
