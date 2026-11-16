(*---
description: Evaluates a random int expression, seed 262, number 3970.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03970 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (CHOOSE r \in [a : {2, 1, 3}] : TRUE) THEN ((-CASE FALSE -> 1 [] OTHER -> -1) + (Head(<<1, 2>>) * Head(<<3, 1, 2>>))) ELSE ((Len(<<>>) * Len(<<>>)) % (Len(<<>>) % Cardinality({1, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03970 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 16 to line 14, col 202 of module random_03970
---*)
