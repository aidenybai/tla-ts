(*---
description: Evaluates a random record expression, seed 262, number 171.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00171 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + (2147483647 * 2147483647)] EXCEPT !.a = Head((<<3, 1, 2>> \o <<3, 1, 2>>))] EXCEPT !.a = @ + ((-IF FALSE THEN 0 ELSE 2) \div ((<<5, 6>>)[1] * (-1 .. 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00171 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 47 of module random_00171
---*)
