(*---
description: Evaluates a random bool expression, seed 262, number 7038.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07038 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = 0] EXCEPT !.a = @ + (-1 + 2147483647)] EXCEPT !.a = @ + Cardinality((1..3 \ SUBSET {1}))] = [[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = IF TRUE THEN 7 ELSE 0] EXCEPT !.a = @ + IF (3 < 2147483647) THEN LET b10792 == 1 IN 2147483647 ELSE (CHOOSE b10793 \in {2, 1, 3} : TRUE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07038 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
