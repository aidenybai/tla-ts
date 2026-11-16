(*---
description: Evaluates a random record expression, seed 262, number 4203.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04203 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = 2] EXCEPT !.a = @ + LET b6610 == 7 IN 1] EXCEPT !.a = ((CHOOSE b6611 \in 2..1 : TRUE) - (7 - 2147483647))] EXCEPT !.a = @ + [[[[a |-> 1] EXCEPT !.a = 2147483647] EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a] EXCEPT !.a = @ + Cardinality((2 .. [a |-> 1, b |-> TRUE]))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04203 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 99 to line 14, col 126 of module random_04203
---*)
