(*---
description: Evaluates a random function expression, seed 262, number 7976.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07976 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x] @@ (1 :> 2)) @@ (\A b12320 \in 2..1 : TRUE)) @@ ([<<5, 6>> EXCEPT ![7] = [x \in Nat |-> x + 1]] @@ <<2, [x \in Nat |-> x + 1]>>)) @@ [b12321 \in {(CHOOSE b12322 \in 2..1 : TRUE), (-3)} |-> IF (2..1 \subseteq 2..1) THEN (b12321 - b12321) ELSE CASE TRUE -> 2147483647 [] OTHER -> b12321]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    TRUE
    2169:0 The second argument of @@ should be a function, but instead it is:
    TRUE
---*)
