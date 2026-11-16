(*---
description: Evaluates a random int expression, seed 262, number 6298.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06298 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (LET b9688 == ([a |-> 1, b |-> TRUE]).a IN (CHOOSE b9689 \in 2..1 : FALSE) < (CHOOSE r \in [a : {1}] : TRUE)) THEN ([[<<5, 6>> EXCEPT ![SUBSET {1}] = 1] EXCEPT !.a = @ + [<<3, 1, 2>> EXCEPT ![1] = -1]]).a ELSE ((([a |-> 1, b |-> TRUE]).a * IF TRUE THEN 1 ELSE 2147483647) * (LET b9690 == 7 IN b9690 \div (0 + 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06298 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 63 to line 14, col 91 of module random_06298
---*)
