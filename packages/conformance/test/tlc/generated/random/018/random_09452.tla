(*---
description: Evaluates a random int expression, seed 262, number 9452.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09452 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (IF FALSE THEN 3 ELSE 0 = CASE TRUE -> 7 [] OTHER -> 2147483647) -> (-(CHOOSE b14669 \in 2..1 : TRUE)) [] OTHER -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a - Cardinality((DOMAIN (1 :> 2) \cup ({2, 1, 3} \cap TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
