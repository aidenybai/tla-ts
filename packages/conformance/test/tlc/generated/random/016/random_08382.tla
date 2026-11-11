(*---
description: Evaluates a random record expression, seed 262, number 8382.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08382 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + (CHOOSE b12966 \in {7, 1} : (\E b12967 \in {1, 2} : FALSE))] EXCEPT !.a = @ + ((LET b12968 == 7 IN 3 :> (<<3, 1, 2>>).a))[((<<5, 6>>)[TRUE] \div IF TRUE THEN 2147483647 ELSE 7)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08382 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 133 of module random_08382
---*)
