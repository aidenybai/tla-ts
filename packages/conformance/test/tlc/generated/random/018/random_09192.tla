(*---
description: Evaluates a random record expression, seed 262, number 9192.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09192 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = (0 % 1)] EXCEPT !.a = ((CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE))[Cardinality({x \in 1..3 : x > 1})]] EXCEPT !.a = (((CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE))[IF TRUE THEN 7 ELSE 0] + IF (<<>> = [x \in Nat |-> x + 1]) THEN ([x \in 1..2 |-> x])[7] ELSE (<<5, 6>>)[3])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09192 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 49 of module random_09192
---*)
