(*---
description: Evaluates a random record expression, seed 262, number 9463.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09463 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + Cardinality({b14705 \in Nat : FALSE})] EXCEPT !.a = (IF (3 \in {1}) THEN (3 * 3) ELSE Cardinality(SUBSET {1}) * LET b14706 == ([a |-> 1, b |-> TRUE]).a IN IF FALSE THEN b14706 ELSE 7)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09463 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 48 of module random_09463
---*)
