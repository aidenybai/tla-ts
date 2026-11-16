(*---
description: Evaluates a random int expression, seed 262, number 3992.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03992 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 % 2147483647) + ([a |-> 1, b |-> TRUE]).a) % Cardinality(DOMAIN 1)) + Cardinality([[b6278 \in {} |-> b6278] EXCEPT ![(0 + [a |-> 1])] = CASE TRUE -> 7 [] OTHER -> 3])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03992 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 79 to line 14, col 86 of module random_03992
---*)
