(*---
description: Evaluates a random function expression, seed 262, number 155.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00155 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(Len(<<1>>) :> CASE TRUE -> 2 [] OTHER -> 7) EXCEPT ![Cardinality(DOMAIN <<5, 6>>)] = IF (FALSE /\ TRUE) THEN (2 % 1) ELSE Cardinality({})] EXCEPT ![((CHOOSE b237 \in DOMAIN [x \in 1..2 |-> x] : (SUBSET {1} \subseteq SUBSET {1})) * ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3]).a)] = ((CHOOSE f \in [1..2 -> {}] : TRUE))[(-(1 * 0))]])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 60 of module random_00155
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 156 of module random_00155
    | <<2>>
---*)
