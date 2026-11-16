(*---
description: Evaluates a random record expression, seed 262, number 4400.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04400 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = (([x \in Nat |-> x + 1])[1] \div CASE FALSE -> 2147483647 [] OTHER -> 2147483647)] EXCEPT !.a = IF (~(0 < 0)) THEN (CASE FALSE -> 1 [] OTHER -> 3 - (CHOOSE b6921 \in SUBSET {1} : TRUE)) ELSE ((3 \div 2) * (2 - -1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04400 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 46 of module random_04400
---*)
