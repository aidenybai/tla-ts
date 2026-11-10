(*---
description: Evaluates a random record expression, seed 262, number 9063.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09063 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF ((TRUE \/ TRUE) <=> Len((1 :> 2))) THEN ((1 % 2147483647) * IF TRUE THEN 3 ELSE -1) ELSE (-CASE FALSE -> [x \in Nat |-> x + 1] [] OTHER -> 0), b |-> (\E b14087 \in ({1, <<>>} \cap {b14088 \in 2..1 : FALSE}) : (([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) @@ (CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09063 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 27 to line 14, col 58 of module random_09063
---*)
