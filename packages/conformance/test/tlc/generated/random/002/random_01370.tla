(*---
description: Evaluates a random bool expression, seed 262, number 1370.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01370 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE TRUE -> 2 [] OTHER -> 0 .. IF TRUE THEN 1 ELSE 7) * [a |-> (2 \div 2147483647), b |-> (FALSE = {1})]) < IF ([[a |-> 1] EXCEPT !.a = @ + 2] \subseteq {2 : b2187 \in {}}) THEN (({x \in 1..3 : x > 1} \cup SUBSET {1}))[([a |-> 1, b |-> TRUE]).a] ELSE ((CHOOSE b2188 \in {x \in 1..3 : x > 1} : TRUE) + (-2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01370 failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    {1}
---*)
