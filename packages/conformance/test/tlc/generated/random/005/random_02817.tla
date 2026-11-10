(*---
description: Evaluates a random int expression, seed 262, number 2817.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02817 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = @ + 1] EXCEPT !.a = (2 - 3)] EXCEPT !.a = ((TRUE \/ TRUE) = (CHOOSE b4474 \in {1, 2} : FALSE))] * LET b4475 == (CHOOSE b4476 \in UNION {2..1, [a |-> 1]} : [b4477 \in {} |-> 2]) IN (-IF TRUE THEN b4475 ELSE b4475)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02817 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 104 to line 14, col 134 of module random_02817
---*)
