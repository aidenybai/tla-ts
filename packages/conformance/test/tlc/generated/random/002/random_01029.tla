(*---
description: Evaluates a random function expression, seed 262, number 1029.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01029 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{} -> 1..2] : TRUE) EXCEPT ![Cardinality(({1, 2} \cap {1}))] = IF (0 = 2) THEN CASE TRUE -> 1 [] OTHER -> 7 ELSE [0 EXCEPT !.a = -1]] @@ (CHOOSE r \in [a : {1, 2}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 50 of module random_01029
    | [a |-> 1]
---*)
