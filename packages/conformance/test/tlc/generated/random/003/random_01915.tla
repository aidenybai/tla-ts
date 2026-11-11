(*---
description: Evaluates a random bool expression, seed 262, number 1915.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01915 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1 % 2147483647) - (2 - 7)) * ((3 :> 2))[CASE TRUE -> 0 [] OTHER -> 7]) % IF ((CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE) = ([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x])) THEN IF (1 \in Nat) THEN (0 * 3) ELSE (CHOOSE b3011 \in 1..3 : FALSE) ELSE ((-1 :> 7))[(2147483647 + 1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01915 failed.
    Attempted to apply function:
    (3 :> 2)
    to argument 0, which is not in the domain of the function.
---*)
